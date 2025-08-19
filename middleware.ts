import tokenService from "@/actions/bevor/token.service";
import axios from "axios";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Protected routes that require authentication
const publicRoutes = ["/shared", "/sign-in", "/not-found", "/404", "/500"];

const attemptRefresh = async (request: NextRequest, response: NextResponse): Promise<void> => {
  /*
  will succeed if both are true:
  - bevor-refresh-token is exists
  - idp token is valid

  if bevor-refresh-token does not exist -> route to login
  if idp token is not valid -> route to logout
  */
  console.log("attempting refresh");

  const refreshToken = request.cookies.get("bevor-refresh-token")?.value;
  if (!refreshToken) {
    throw new Error("no_refresh_token");
  }
  const token = await tokenService.refreshToken(refreshToken);
  response.cookies.set("bevor-token", token.scoped_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: token.expires_at * 1000,
  });
  response.cookies.set("bevor-refresh-token", token.refresh_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: token.refresh_expires_at * 1000,
  });
};

const middleware = async (request: NextRequest): Promise<NextResponse> => {
  const response = NextResponse.next();
  const { pathname } = request.nextUrl;
  console.log("MIDDLEWARE PATH", pathname, request.method);

  const accessToken = request.headers.get("authorization")?.replace("Bearer ", "");
  console.log("PRIVY TOKEN", accessToken?.substring(0, 10));

  if (pathname.startsWith("/teams")) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      // TODO: might need to put this in a cookie.
      response.headers.set("bevor-team-slug", segments[1]);
    }
  }

  if (pathname.includes(".") || pathname.startsWith("/api")) {
    return response;
  }

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  // do NOT use the "use server" equivalent. It isn't accessible in middleware edge context
  let teamsRedirect = NextResponse.redirect(new URL("/teams", request.url));
  let logoutRedirect = NextResponse.redirect(new URL("/logout", request.url));
  let loginRedirect = NextResponse.redirect(new URL("/sign-in", request.url));
  if (!isPublicRoute) {
    try {
      await tokenService.validateToken();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.data) {
          console.log(err.response.data.code);
          switch (err.response.data.code) {
            case "invalid_team_membership":
              // either attempting access to a team they don't belong to, or the slug was changed
              // and they weren't aware. In either instance, route to /teams and let that logic decide what to do.
              teamsRedirect.cookies.delete("bevor-recent-team");
              return teamsRedirect;
            case "session_token_expired":
              try {
                await attemptRefresh(request, response);
              } catch (error) {
                if (error instanceof Error) {
                  if (error.message === "no_refresh_token") return loginRedirect;
                }
                // delegate deleting cookies to the intermittent page, and IDP client-side logout()
                return logoutRedirect;
              }
            case "session_token_revoked":
            case "session_token_invalid":
              // force a logout. Either manually revoked, out of sync with cookie, or tampered with.
              return logoutRedirect;
            default:
              return logoutRedirect;
          }
        } else {
          return logoutRedirect;
        }
      } else {
        try {
          await attemptRefresh(request, response);
        } catch (error) {
          if (error instanceof Error) {
            if (error.message === "no_refresh_token") return loginRedirect;
          }
          // delegate deleting cookies to the intermittent page, and IDP client-side logout()
          return logoutRedirect;
        }
      }
    }
  }

  if (pathname.startsWith("/sign-in")) {
    try {
      await tokenService.validateToken();
      // If we got here, they're already logged in → redirect them away
      const lastTeam = request.cookies.get("bevor-recent-team");
      if (lastTeam) {
        console.log("attempt at sign-in, routing to /teams/slug");
        return NextResponse.redirect(new URL(`/teams/${lastTeam}`, request.url));
      } else {
        console.log("attempt at sign-in, routing to /teams");
        return teamsRedirect;
      }
    } catch {
      try {
        await attemptRefresh(request, response);
      } catch (error) {
        if (error instanceof Error) {
          if (error.message === "no_refresh_token") {
            return response;
          }
        }
        const lastTeam = request.cookies.get("bevor-recent-team");
        if (lastTeam) {
          console.log("attempt at sign-in, able to refresh, routing to /teams/slug");
          return NextResponse.redirect(new URL(`/teams/${lastTeam}`, request.url));
        } else {
          console.log("attempt at sign-in, able to refresh, routing to /teams");
          return teamsRedirect;
        }
      }
    }
  }

  return response;
};

// Configure which routes the middleware should run on
export const config = {
  matcher: ["/teams/:path*", "/user/:path*", "/admin/:path*", "/sign-in"],
};

export default middleware;

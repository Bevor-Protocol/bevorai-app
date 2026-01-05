import { tokenActions } from "@/actions/bevor";
import axios from "axios";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Protected routes that require authentication
const publicRoutes = ["/shared", "/sign-in", "/not-found", "/404", "/500"];

const forceLogout = async (request: NextRequest): Promise<NextResponse> => {
  const refreshToken = request.cookies.get("bevor-refresh-token");
  if (refreshToken) {
    await tokenActions.revokeToken(refreshToken.value);
  }

  const logoutRedirect = NextResponse.redirect(new URL("/sign-in", request.url));
  logoutRedirect.cookies.delete("bevor-token");
  logoutRedirect.cookies.delete("bevor-refresh-token");
  logoutRedirect.cookies.delete("bevor-recent-team");
  return logoutRedirect;
};

const attemptRefresh = async (
  request: NextRequest,
  response: NextResponse,
  isSignIn: boolean = false,
): Promise<NextResponse> => {
  try {
    const refreshToken = request.cookies.get("bevor-refresh-token")?.value;
    if (!refreshToken) {
      throw new Error("no_refresh_token");
    }

    const token = await tokenActions.refreshToken(refreshToken).then((r) => {
      if (!r.ok) throw r;
      return r.data;
    });

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

    if (isSignIn) {
      const lastTeam = request.cookies.get("bevor-recent-team");
      if (lastTeam) {
        return NextResponse.redirect(new URL(`/team/${lastTeam}`, request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }

    return response;
  } catch {
    if (isSignIn) {
      return response;
    }
    return forceLogout(request);
  }
};

const staticRoots = new Set(["user", "admin", "sign-in", "account", "api", "team"]);

const proxy = async (request: NextRequest): Promise<NextResponse> => {
  const response = NextResponse.next();
  const { pathname, searchParams } = request.nextUrl;

  if (pathname.includes(".") || pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return response;
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0) {
    const first = segments[0];
    if (first === "team" && segments.length > 1) {
      // extract team slug from /team/[teamSlug] path
      const teamSlug = segments[1];
      response.cookies.set("bevor-recent-team", teamSlug);
    } else if (!staticRoots.has(first)) {
      // treat the first segment as the team slug (for backwards compatibility)
      response.cookies.set("bevor-recent-team", first);
    }
  }

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  // do NOT use the "use server" equivalent. It isn't accessible in middleware edge context

  if (!isPublicRoute) {
    try {
      await tokenActions.validateToken();
    } catch (err) {
      if (axios.isAxiosError(err)) {
        if (err.response?.data) {
          switch (err.response.data.code) {
            case "invalid_team_membership": {
              // either attempting access to a team they don't belong to, or the slug was changed
              // and they weren't aware. In either instance, route to / and let that logic decide what to do.
              const teamsRedirect = NextResponse.redirect(new URL("/", request.url));
              teamsRedirect.cookies.delete("bevor-recent-team");
              return teamsRedirect;
            }
            case "session_token_expired":
              return await attemptRefresh(request, response);
            default:
              // session_revoked, session_token_invalid, or other
              return forceLogout(request);
          }
        } else {
          return forceLogout(request);
        }
      } else {
        // some unexpected error;
        return forceLogout(request);
      }
    }
  }

  if (pathname.startsWith("/sign-in") && !searchParams.has("method")) {
    try {
      await tokenActions.validateToken().then((r) => {
        if (!r.ok) throw r;
        return r.data;
      });
      // If we got here, they're already logged in → redirect them away
      const lastTeam = request.cookies.get("bevor-recent-team");
      if (lastTeam) {
        return NextResponse.redirect(new URL(`/team/${lastTeam.value}`, request.url));
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch {
      return await attemptRefresh(request, response, true);
    }
  }

  return response;
};

// Configure which routes the middleware should run on
export const config = {
  matcher: ["/user/:path*", "/admin/:path*", "/sign-in", "/team/:teamSlug/:path*", "/"],
};

export default proxy;

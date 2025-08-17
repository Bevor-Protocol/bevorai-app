import authController from "@/actions/auth/auth.service";
import { getLastVisitedTeam, setLastVisitedTeam } from "@/actions/cookies";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Protected routes that require authentication
const publicRoutes = ["/shared", "/sign-in"];

const middleware = async (request: NextRequest): Promise<NextResponse> => {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  if (pathname.includes(".") || pathname.startsWith("/api")) {
    return response;
  }

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));
  // do NOT use the "use server" equivalent. It isn't accessible in middleware edge context
  const authorizedUser = await authController.currentUser();
  if (!isPublicRoute) {
    if (!authorizedUser) {
      try {
        // refresh only if authenticated
        const privyUserId = await authController.getAuthentication();
        const user = await authController.getUser(privyUserId);
        const token = await authController.issueToken(user);
        const response = NextResponse.next();
        const date = new Date(token.expires_at * 1000);
        response.cookies.set("bevor-token", token.scoped_token, {
          expires: date,
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });
        return response;
      } catch (error) {
        console.log("failed to refresh", error);
        return NextResponse.redirect(new URL("/sign-in", request.url));
      }
    }
  }

  if (pathname.startsWith("/sign-in")) {
    if (authorizedUser) {
      const lastTeam = await getLastVisitedTeam();
      if (lastTeam) {
        return NextResponse.redirect(new URL(`/teams/${lastTeam}`, request.url));
      } else {
        return NextResponse.redirect(new URL("/teams", request.url));
      }
    }
  }

  if (pathname.startsWith("/teams")) {
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1) {
      await setLastVisitedTeam(segments[1]);
    }
  }

  return response;
};

// Configure which routes the middleware should run on
const config = {
  matcher: [
    {
      regexp: "/teams/*",
    },
    {
      regexp: "/user/*",
    },
    {
      regexp: "/admin/*",
    },
  ],
};

export { config, middleware };

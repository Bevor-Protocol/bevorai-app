import { authActions } from "@/actions/bevor";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("stytch_token_type");
  const token = searchParams.get("token");

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_auth_code", request.url));
  }
  if (!token) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_auth_token", request.url));
  }

  let handler;
  if (code === "oauth") {
    handler = authActions.authenticateOauth;
  } else {
    handler = authActions.authenticateMagicLink;
  }

  return await handler(token)
    .then((response) => {
      return authActions.exchangeToken(response);
    })
    .then((response) => {
      const redirectResponse = NextResponse.redirect(new URL("/teams", request.url));
      redirectResponse.cookies.set("bevor-token", response.scoped_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(response.expires_at * 1000),
      });

      redirectResponse.cookies.set("bevor-refresh-token", response.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(response.refresh_expires_at * 1000),
      });

      return redirectResponse;
    })
    .catch((error) => {
      console.log(error);
      return NextResponse.redirect(new URL("/sign-in?error=auth_failed", request.url));
    });
}

import { authActions } from "@/actions/bevor";
import { NextRequest, NextResponse } from "next/server";

/*
This route is the callback for various stytch oauth routes.
Login, signup, or attach.
We have these dynamic tags such that we can route appropriately after, but under the hood, the backend does the exact same
thing for each.
*/

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tag: string }> },
): Promise<NextResponse> {
  const { tag } = await params;

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("stytch_token_type");
  const token = searchParams.get("token");

  if (tag !== "login" && tag !== "signup" && tag !== "attach") {
    return NextResponse.redirect(new URL("/sign-in?error=invalid_tag", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_auth_code", request.url));
  }
  if (code !== "oauth" && code !== "magic_links") {
    return NextResponse.redirect(new URL("/sign-in?error=invalid_auth_code", request.url));
  }
  if (!token) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_auth_token", request.url));
  }

  let redirect = "/";
  if (tag === "attach") {
    // the route we expose attaching oauth from, route back here.
    redirect = "/user";
  } else if (tag === "signup") {
    redirect = "/?is_signup=true";
  }

  return await authActions
    .authenticate({ token, method: code })
    .then((response) => {
      const redirectResponse = NextResponse.redirect(new URL(redirect, request.url));
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

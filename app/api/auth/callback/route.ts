import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import stytch from "stytch";

const stytchClient = new stytch.Client({
  project_id: process.env.NEXT_STYTCH_PROJECT_ID!,
  secret: process.env.NEXT_STYTCH_SECRET!,
});

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("stytch_token_type");
  const token = searchParams.get("token");

  if (!code && !token) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_auth_code", request.url));
  }
  if (!token) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_auth_token", request.url));
  }

  const idpResponse = await stytchClient.oauth.authenticate({ token, session_duration_minutes: 5 });
  return axios
    .post(
      `${process.env.API_URL}/token/issue`,
      {
        user_id: idpResponse.user_id,
      },
      {
        headers: {
          Authorization: `Bearer ${idpResponse.session_jwt}`,
        },
      },
    )
    .then((response) => {
      const redirectResponse = NextResponse.redirect(new URL("/teams", request.url));
      redirectResponse.cookies.set("bevor-token", response.data.scoped_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(response.data.expires_at * 1000),
      });

      redirectResponse.cookies.set("bevor-refresh-token", response.data.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: new Date(response.data.refresh_expires_at * 1000),
      });

      return redirectResponse;
    })
    .catch((error) => {
      console.log(error);
      return NextResponse.redirect(new URL("/sign-in?error=auth_failed", request.url));
    });
}

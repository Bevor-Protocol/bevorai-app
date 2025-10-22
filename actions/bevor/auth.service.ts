"use server";

import { idpApi } from "@/lib/api";
import { TokenIssueResponse } from "@/utils/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import stytch from "stytch";
import { revokeToken } from "./token.service";

const stytchClient = new stytch.Client({
  project_id: process.env.NEXT_STYTCH_PROJECT_ID!,
  secret: process.env.NEXT_STYTCH_SECRET!,
});

/*
setting the session_duration_minutes is required, with a minimum of 5mins.
Otherwise, you don't get a session_token or a session_jwt in the response.
*/

export const authenticateOauth = async (
  token: string,
): Promise<{ user_id: string; idp_jwt: string }> => {
  return stytchClient.oauth
    .authenticate({ token, session_duration_minutes: 5 })
    .then((response) => ({ user_id: response.user_id, idp_jwt: response.session_jwt }));
};

export const authenticateMagicLink = async (
  token: string,
): Promise<{ user_id: string; idp_jwt: string }> => {
  return stytchClient.magicLinks
    .authenticate({ token, session_duration_minutes: 5 })
    .then((response) => ({ user_id: response.user_id, idp_jwt: response.session_jwt }));
};

export const exchangeToken = async (data: {
  idp_jwt: string;
  user_id: string;
}): Promise<TokenIssueResponse> => {
  // handshake between IDP and my server
  const headers = { Authorization: `Bearer ${data.idp_jwt}` };
  const body = { user_id: data.user_id };
  return idpApi.post("/token/issue", body, { headers }).then((response) => {
    return response.data;
  });
};

export const logout = async (): Promise<void> => {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("bevor-refresh-token")?.value;
  if (!refreshToken) {
    cookieStore.delete("bevor-token");
    cookieStore.delete("bevor-refresh-token");
    cookieStore.delete("bevor-recent-team");
    redirect("/sign-in");
  }
  return revokeToken(refreshToken).then(() => {
    cookieStore.delete("bevor-token");
    cookieStore.delete("bevor-refresh-token");
    cookieStore.delete("bevor-recent-team");
    redirect("/sign-in");
  });
};

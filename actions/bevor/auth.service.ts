"use server";

import api, { idpApi } from "@/lib/api";
import { TokenIssueResponse } from "@/utils/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revokeToken } from "./token.service";

/*
setting the session_duration_minutes is required, with a minimum of 5mins.
Otherwise, you don't get a session_token or a session_jwt in the response.
*/

export const getBaseUrl = async (): Promise<string> => process.env.API_URL!;

export const magicLink = async (
  email: string,
  data: {
    login_magic_link_url: string;
    signup_magic_link_url: string;
  },
): Promise<boolean> => {
  return idpApi.post("/user/auth/magic-link", { ...data, email }).then((response) => {
    return response.data.is_user_created;
  });
};

export const authenticate = async (data: {
  token: string;
  method: "oauth" | "magic_links";
}): Promise<TokenIssueResponse> => {
  // the token acts as the authorization. This handles authentication + token issuance.
  return idpApi.post("/user/auth/authenticate", data).then((response) => {
    return response.data;
  });
};

export const getAttachToken = async (providerName: string): Promise<string> => {
  return api.get(`/user/auth/attach?provider_name=${providerName}`).then((response) => {
    return response.data.token;
  });
};

export const detachOAuth = async (providerName: "google" | "github"): Promise<void> => {
  return api.delete(`/user/auth/oauth/${providerName}`).then(() => {
    return;
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

"use server";

import api from "@/lib/api";
import { TokenIssueResponse } from "@/utils/types";

export const validateToken = async (): Promise<{ user_id: string }> => {
  return api.get("/token/validate").then((response) => {
    return response.data;
  });
};

export const refreshToken = async (refreshToken: string): Promise<TokenIssueResponse> => {
  // does not require authorization. We'll look for session expiry and valid refresh tokens in the api.
  return api
    .post("/token/refresh", { refresh_token: refreshToken }, { headers: { skip_token: true } })
    .then((response) => {
      return response.data;
    });
};

export const revokeToken = async (refreshToken: string): Promise<boolean> => {
  return api
    .post("/token/revoke", { refresh_token: refreshToken }, { headers: { skip_token: true } })
    .then((response) => {
      return response.data.success;
    });
};

export const revokeAllTokens = async (): Promise<boolean> => {
  return api.post("/token/revoke/all").then((response) => {
    return response.data.boolean;
  });
};

export const issueSSEToken = async (): Promise<string> => {
  return api.post("/events/auth", {}).then((response) => {
    return response.data.id;
  });
};

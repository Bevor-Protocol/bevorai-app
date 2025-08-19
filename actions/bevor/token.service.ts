import api, { idpApi } from "@/lib/api";
import { TokenIssueResponse } from "@/utils/types";
import { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";
import { cookies } from "next/headers";

class TokenService {
  async validateToken(): Promise<{ user_id: string }> {
    return api.get("/token/validate").then((response) => {
      return response.data;
    });
  }

  async issueToken(): Promise<TokenIssueResponse> {
    // handshake between IDP and my server
    return idpApi.post("/token/issue").then((response) => {
      return response.data;
    });
  }

  async refreshToken(refreshToken: string): Promise<TokenIssueResponse> {
    // does not require authorization. We'll look for session expiry and valid refresh tokens in the api.
    return api
      .post("/token/refresh", { refresh_token: refreshToken }, { headers: { "skip-auth": true } })
      .then((response) => {
        return response.data;
      });
  }

  async revokeToken(refreshToken: string): Promise<boolean> {
    return api
      .post("/token/revoke", { refresh_token: refreshToken }, { headers: { "skip-auth": true } })
      .then((response) => {
        return response.data.success;
      });
  }

  async revokeAllTokens(): Promise<boolean> {
    return api.post("/token/revoke/all").then((response) => {
      return response.data.boolean;
    });
  }

  async setSessionToken(token: TokenIssueResponse): Promise<void> {
    const cookieStore = await cookies();
    const cookieMetadata: Partial<ResponseCookie> = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    };
    cookieStore.set("bevor-token", token.scoped_token, {
      ...cookieMetadata,
      expires: token.expires_at * 1000,
    });
    cookieStore.set("bevor-refresh-token", token.refresh_token, {
      ...cookieMetadata,
      expires: token.refresh_expires_at * 1000,
    });
  }
}

const tokenService = new TokenService();
export default tokenService;

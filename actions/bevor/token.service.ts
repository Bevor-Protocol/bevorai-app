import api, { idpApi } from "@/lib/api";
import { TokenIssueResponse } from "@/utils/types";

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
}

const tokenService = new TokenService();
export default tokenService;

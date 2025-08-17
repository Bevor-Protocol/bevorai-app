import { deleteSessionToken } from "@/actions/cookies";
import api, { adminApi } from "@/lib/api";
import * as privy from "@privy-io/server-auth";
import { cookies } from "next/headers";

const privyClient = new privy.PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!,
);

class AuthController {
  constructor() {}

  async getAuthentication(): Promise<string> {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("privy-token")?.value;
    if (!accessToken) {
      throw new Error("no access token");
    }

    return privyClient.verifyAuthToken(accessToken).then((claims) => {
      return claims.userId;
    });
  }

  async currentUser(): Promise<{ teamId: string; userId: string } | null> {
    return api
      .get("/token/validate")
      .then((response) => {
        if (!response.data) {
          throw new Error(response.statusText);
        }
        return {
          teamId: response.data.team_id,
          userId: response.data.user_id,
        };
      })
      .catch(() => {
        console.log("invalid token");
        return null;
      });
  }

  async revokeToken(): Promise<void> {
    return api.post("/token/revoke", {}).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return deleteSessionToken();
    });
  }

  async issueToken(data: { team_id: string; user_id: string }): Promise<{
    scoped_token: string;
    expires_at: number;
  }> {
    return adminApi.post("/token/issue", data).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async createUser(privyId: string): Promise<{
    team_id: string;
    user_id: string;
  }> {
    return adminApi.post("/user", { provider_id: privyId }).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }

  async getUser(privyId: string): Promise<{
    team_id: string;
    user_id: string;
  }> {
    return adminApi.get(`/user/${privyId}`).then((response) => {
      if (!response.data) {
        throw new Error(response.statusText);
      }
      return response.data;
    });
  }
}

const authController = new AuthController();
export default authController;

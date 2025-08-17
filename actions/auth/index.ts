"use server";

import { setSessionToken } from "@/actions/cookies";
import authController from "./auth.service";

const getCurrentUser = async (): Promise<{ teamId: string; userId: string } | null> => {
  // authorized through our python api
  return authController.currentUser();
};

const login = async (privyUserId: string): Promise<void> => {
  // can't redirect, as the cookie won't be set yet until this is returned.
  // so it would just get caught up failing the middleware
  const authedUser = await authController.currentUser();
  if (authedUser) {
    return;
  }
  const user = await authController.createUser(privyUserId);
  const token = await authController.issueToken(user);

  await setSessionToken(token.scoped_token, token.expires_at);
};

const logout = async (): Promise<void> => {
  // can't redirect since the cookie wouldn't be deleted yet.
  await authController.revokeToken();
};

export { getCurrentUser, login, logout };

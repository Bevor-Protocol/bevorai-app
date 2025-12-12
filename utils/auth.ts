"use client";

export const start = async (data: {
  providerName: "google" | "github";
  loginRedirect?: string;
  signupRedirect?: string;
  oauth_attach_token?: string;
}): Promise<void> => {
  const baseURL = window.location.origin;

  const loginRedirect = data.loginRedirect ?? "/api/auth/callback/login";
  const signupRedirect = data.signupRedirect ?? "/api/auth/callback/signup";

  const searchParams = new URLSearchParams({
    public_token: process.env.NEXT_PUBLIC_STYTCH_TOKEN!,
    login_redirect_url: `${baseURL}${loginRedirect}`,
    signup_redirect_url: `${baseURL}${signupRedirect}`,
  });

  if (data.oauth_attach_token) {
    searchParams.set("oauth_attach_token", data.oauth_attach_token);
  }

  window.location.replace(
    `https://test.stytch.com/v1/public/oauth/${data.providerName}/start?${searchParams.toString()}`,
  );
};

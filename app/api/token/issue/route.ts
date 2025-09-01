// app/api/login/route.ts
import tokenService from "@/actions/bevor/token.service";
import { NextResponse } from "next/server";

// app/api/login/route.ts

export const POST = async (): Promise<NextResponse> => {
  console.log("[v0] Starting login route handler");

  // Your existing login logic
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      const token = await tokenService.issueToken();
      const response = NextResponse.json({ success: true }, { status: 202 });

      response.cookies.set("bevor-token", token.scoped_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: token.expires_at * 1000,
      });

      response.cookies.set("bevor-refresh-token", token.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: token.refresh_expires_at * 1000,
      });

      return response;
    } catch {
      attempts++;
      if (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  return NextResponse.json({ success: false }, { status: 401 });
};

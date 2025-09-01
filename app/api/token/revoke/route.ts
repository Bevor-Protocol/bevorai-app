import tokenService from "@/actions/bevor/token.service";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    console.log("[v0] Starting login route handler");

    const refreshToken = request.cookies.get("bevor-refresh-token");
    // don't redirect to sign-in. We need to logout of the IDP on the client first.
    const response = NextResponse.json({ success: true }, { status: 202 });

    if (!refreshToken) {
      return response;
    }

    await tokenService.revokeToken(refreshToken.value);

    response.cookies.delete("bevor-token");
    response.cookies.delete("bevor-refresh-token");
    response.cookies.delete("bevor-team-slug");

    return response;
  } catch (error) {
    console.log("[v0] Route handler error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
};

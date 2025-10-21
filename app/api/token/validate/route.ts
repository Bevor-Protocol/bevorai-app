import tokenService from "@/actions/bevor/token.service";
import { NextResponse } from "next/server";

export const GET = async (): Promise<NextResponse> => {
  try {
    await tokenService.validateToken();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json({ success: false }, { status: 401 });
  }
};

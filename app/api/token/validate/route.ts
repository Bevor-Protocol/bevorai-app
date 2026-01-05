import { tokenActions } from "@/actions/bevor";
import { NextResponse } from "next/server";

export const GET = async (): Promise<NextResponse> => {
  try {
    await tokenActions.validateToken().then((r) => {
      if (!r.ok) throw r;
    });
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json({ success: false }, { status: 401 });
  }
};

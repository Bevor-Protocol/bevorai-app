import { tokenActions } from "@/actions/bevor";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest): Promise<NextResponse> => {
  try {
    const refreshToken = request.cookies.get("bevor-refresh-token");
    // don't redirect to sign-in. We need to logout of the IDP on the client first.
    const response = NextResponse.json({ success: true }, { status: 202 });

    if (!refreshToken) {
      return response;
    }

    await tokenActions.revokeToken(refreshToken.value).then((r) => {
      if (!r.ok) throw r;
      return r.data;
    });

    response.cookies.delete("bevor-token");
    response.cookies.delete("bevor-refresh-token");
    response.cookies.delete("bevor-recent-team");

    return response;
  } catch (error) {
    console.log(error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
};

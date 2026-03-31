import { tokenActions } from "@/actions/bevor";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let sessionToken = req.cookies.get("bevor-token")?.value;
  const refreshToken = req.cookies.get("bevor-refresh-token")?.value;

  if (!refreshToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let needsRefresh = !sessionToken;
  if (!needsRefresh) {
    const validation = await tokenActions.validateToken();
    if (!validation.ok) {
      if ((validation.error as any)?.code === "session_token_expired") {
        needsRefresh = true;
      } else {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }
  }

  if (needsRefresh) {
    const tokenRes = await tokenActions.refreshToken(refreshToken);
    if (!tokenRes.ok) return NextResponse.json({ error: "Session expired" }, { status: 401 });
    sessionToken = tokenRes.data.scoped_token;
  }

  const { teamSlug } = await req.json();
  if (!teamSlug) return NextResponse.json({ error: "Missing teamSlug" }, { status: 400 });

  const apiUrl = process.env.API_URL!;
  const headers = {
    Authorization: `Bearer ${sessionToken}`,
    "bevor-team-slug": teamSlug,
  };

  const suffix = Math.random().toString(36).slice(2, 7);
  const res = await axios.post(
    `${apiUrl}/business/projects`,
    { name: `audit-${suffix}` },
    { headers },
  );

  return NextResponse.json(res.data);
}

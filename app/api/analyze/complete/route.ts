import { tokenActions } from "@/actions/bevor";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function sse(data: object): Uint8Array {
  return new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`);
}

async function pollCodeStatus(
  apiUrl: string,
  codeId: string,
  headers: Record<string, string>,
): Promise<"success" | "failed" | "timeout"> {
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const res = await axios.get(`${apiUrl}/graph/versions/${codeId}`, { headers });
    const status = res.data.status as string;
    if (status === "success") return "success";
    if (status === "failed" || status === "partial") return "failed";
  }
  return "timeout";
}

export async function POST(req: NextRequest): Promise<Response> {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(sse(data));
      const fail = (message: string) => {
        send({ type: "error", message });
        controller.close();
      };

      try {
        let sessionToken = req.cookies.get("bevor-token")?.value;
        const refreshToken = req.cookies.get("bevor-refresh-token")?.value;

        if (!refreshToken) return fail("Unauthorized");

        let needsRefresh = !sessionToken;
        if (!needsRefresh) {
          const validation = await tokenActions.validateToken();
          if (!validation.ok) {
            if ((validation.error as any)?.code === "session_token_expired") {
              needsRefresh = true;
            } else {
              return fail("Unauthorized");
            }
          }
        }

        if (needsRefresh) {
          const tokenRes = await tokenActions.refreshToken(refreshToken);
          if (!tokenRes.ok) return fail("Session expired");
          sessionToken = tokenRes.data.scoped_token;
        }

        const { projectId, projectSlug, codeVersionId, teamSlug } = await req.json();
        if (!projectId || !codeVersionId || !teamSlug) return fail("Missing required fields");

        const apiUrl = process.env.API_URL!;
        const headers: Record<string, string> = {
          Authorization: `Bearer ${sessionToken}`,
          "bevor-team-slug": teamSlug,
        };

        send({ type: "step", step: "processing" });
        const codeStatus = await pollCodeStatus(apiUrl, codeVersionId, headers);
        if (codeStatus !== "success") {
          return fail("Code processing failed. Please try again.");
        }

        send({ type: "step", step: "analysis" });
        const analysisRes = await axios.post(
          `${apiUrl}/security/analyses`,
          {
            project_id: projectId,
            code_version_id: codeVersionId,
            scopes: [],
            scope_strategy: "all",
          },
          { headers },
        );

        send({
          type: "done",
          analysisId: analysisRes.data.id,
          projectSlug,
          teamSlug,
        });
        controller.close();
      } catch (err: any) {
        const message =
          err?.response?.data?.message ?? err?.message ?? "Something went wrong";
        try {
          controller.enqueue(sse({ type: "error", message }));
          controller.close();
        } catch {
          // controller already closed
        }
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

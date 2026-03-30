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
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => controller.enqueue(sse(data));
      const fail = (message: string) => {
        send({ type: "error", message });
        controller.close();
      };

      try {
        // ── Auth ──────────────────────────────────────────────────────────────
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

        // ── Parse form ────────────────────────────────────────────────────────
        const formData = await req.formData();
        const teamSlug = formData.get("teamSlug") as string;
        const uploadType = formData.get("uploadType") as string;

        if (!teamSlug || !uploadType) return fail("Missing required fields");

        const apiUrl = process.env.API_URL!;
        const headers: Record<string, string> = {
          Authorization: `Bearer ${sessionToken}`,
          "bevor-team-slug": teamSlug,
        };

        // ── Step 1: Create project ────────────────────────────────────────────
        send({ type: "step", step: "project", message: "Creating project..." });

        const suffix = Math.random().toString(36).slice(2, 7);
        const projectRes = await axios.post(
          `${apiUrl}/business/projects`,
          { name: `audit-${suffix}` },
          { headers },
        );
        const project = projectRes.data as { id: string; slug: string };

        // ── Step 2: Upload code ───────────────────────────────────────────────
        send({ type: "step", step: "upload", message: "Uploading code..." });

        let codeVersionId: string;

        if (uploadType === "file") {
          const file = formData.get("file") as File;
          const fd = new FormData();
          fd.append("files", file);
          fd.append("project_id", project.id);
          const res = await axios.post(`${apiUrl}/graph/versions/file`, fd, { headers });
          codeVersionId = res.data.id;
        } else if (uploadType === "paste") {
          const content = formData.get("content") as string;
          const res = await axios.post(
            `${apiUrl}/graph/versions/paste`,
            { project_id: project.id, content },
            { headers },
          );
          codeVersionId = res.data.id;
        } else if (uploadType === "scan") {
          const address = formData.get("address") as string;
          const res = await axios.post(
            `${apiUrl}/graph/versions/scan`,
            { address, project_id: project.id },
            { headers },
          );
          codeVersionId = res.data.id;
        } else if (uploadType === "repo") {
          const url = formData.get("url") as string;
          const res = await axios.post(
            `${apiUrl}/graph/versions/repo`,
            { url, project_id: project.id },
            { headers },
          );
          codeVersionId = res.data.id;
        } else if (uploadType === "folder") {
          // Folder upload requires a signing key (browser-facing endpoint with no Bearer token).
          // Get signing key first, then upload the raw zip bytes.
          const signingRes = await axios.post(
            `${apiUrl}/graph/versions/signing-key`,
            { project_id: project.id },
            { headers },
          );
          const signingKey = signingRes.data.signing_key as string;

          const zip = formData.get("zip") as File;
          const zipBytes = await zip.arrayBuffer();
          const res = await axios.post(
            `${apiUrl}/graph/versions/folder?signing_key=${signingKey}`,
            zipBytes,
            {
              headers: { "Content-Type": "application/zip" },
            },
          );
          codeVersionId = res.data.id;
        } else {
          return fail("Invalid upload type");
        }

        // ── Step 3: Wait for code processing ─────────────────────────────────
        send({ type: "step", step: "processing", message: "Processing code..." });

        const codeStatus = await pollCodeStatus(apiUrl, codeVersionId, headers);
        if (codeStatus !== "success") {
          return fail("Code processing failed. Please try again.");
        }

        // ── Step 4: Create analysis ───────────────────────────────────────────
        send({ type: "step", step: "analysis", message: "Creating analysis..." });

        const analysisRes = await axios.post(
          `${apiUrl}/security/analyses`,
          {
            project_id: project.id,
            code_version_id: codeVersionId,
            scopes: [],
            scope_strategy: "all",
          },
          { headers },
        );

        // ── Done ──────────────────────────────────────────────────────────────
        send({
          type: "done",
          analysisId: analysisRes.data.id,
          projectSlug: project.slug,
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

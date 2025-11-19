import { streaming_api } from "@/lib/api";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return new Response(JSON.stringify({ error: "Missing path parameter" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const sessionToken = req.cookies.get("bevor-token")?.value;
    const teamSlug = req.cookies.get("bevor-team-slug")?.value;

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${sessionToken}`,
    };

    if (teamSlug) {
      headers["Bevor-Team-Id"] = teamSlug;
    }

    const queryParams = searchParams
      .toString()
      .replace(/^path=[^&]*&?/, "")
      .replace(/&$/, "");
    const fullPath = queryParams ? `${path}?${queryParams}` : path;

    const stream = new ReadableStream({
      async start(controller: ReadableStreamDefaultController): Promise<void> {
        try {
          const response = await streaming_api.get(fullPath, {
            headers,
            responseType: "stream",
          });

          const dataStream = response.data;

          for await (const chunk of dataStream) {
            controller.enqueue(chunk);
          }

          controller.close();
        } catch (err) {
          console.error("SSE proxy error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("SSE API error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { searchParams } = new URL(req.url);
    const path = searchParams.get("path");

    if (!path) {
      return new Response(JSON.stringify({ error: "Missing path parameter" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const sessionToken = req.cookies.get("bevor-token")?.value;
    const teamSlug = req.cookies.get("bevor-team-slug")?.value;

    if (!sessionToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const body = await req.json().catch(() => ({}));

    const headers: Record<string, string> = {
      Authorization: `Bearer ${sessionToken}`,
    };

    if (teamSlug) {
      headers["Bevor-Team-Id"] = teamSlug;
    }

    const queryParams = searchParams
      .toString()
      .replace(/^path=[^&]*&?/, "")
      .replace(/&$/, "");
    const fullPath = queryParams ? `${path}?${queryParams}` : path;

    const stream = new ReadableStream({
      async start(controller: ReadableStreamDefaultController): Promise<void> {
        try {
          const response = await streaming_api.post(fullPath, body, {
            headers,
            responseType: "stream",
          });

          const dataStream = response.data;

          for await (const chunk of dataStream) {
            controller.enqueue(chunk);
          }

          controller.close();
        } catch (err) {
          console.error("SSE proxy error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("SSE API error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

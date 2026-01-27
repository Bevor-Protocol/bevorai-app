import { tokenActions } from "@/actions/bevor";
import { streaming_api } from "@/lib/api";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({
          error: "Invalid JSON in request body",
          details: parseError instanceof Error ? parseError.message : String(parseError),
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    }

    // since this /api route bypasses the proxy, we need session refresh baked in.

    const { chatId, ...rest } = requestBody;

    let sessionToken = req.cookies.get("bevor-token")?.value;
    const refreshToken = req.cookies.get("bevor-refresh-token")?.value;
    const teamSlug = req.cookies.get("bevor-recent-team")?.value;

    if (!refreshToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let needsRefresh = !sessionToken;
    if (!needsRefresh) {
      try {
        await tokenActions.validateToken();
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.data?.code === "session_token_expired") {
          needsRefresh = true;
        } else {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
    }

    if (needsRefresh) {
      const tokenResponse = await tokenActions.refreshToken(refreshToken);
      if (!tokenResponse.ok) {
        return new Response(JSON.stringify({ error: "Session expired" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }
      sessionToken = tokenResponse.data.scoped_token;
    }

    const stream = new ReadableStream({
      async start(controller: ReadableStreamDefaultController): Promise<void> {
        try {
          const response = await streaming_api.post(
            `/chats/${chatId}/stream`,
            { ...rest },
            {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
                "Bevor-Team-Slug": teamSlug,
              },
            },
          );

          const dataStream = response.data;
          for await (const chunk of dataStream) {
            controller.enqueue(chunk);
          }

          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
}

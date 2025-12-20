import { streaming_api } from "@/lib/api";
import { NextRequest } from "next/server";

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

    const { chatId, ...rest } = requestBody;

    const sessionToken = req.cookies.get("bevor-token")?.value;
    const teamSlug = req.cookies.get("bevor-recent-team")?.value;

    if (!sessionToken) {
      throw new Error("invalidate token");
    }
    // Create a new ReadableStream for streaming the response
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

          // Get the response as a stream
          // Axios with responseType: 'stream' provides the data directly as a stream
          const dataStream = response.data;

          // Process the stream
          for await (const chunk of dataStream) {
            // Send the chunk to the client
            controller.enqueue(chunk);
          }

          // Close the stream when done
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    // Return the stream with appropriate headers
    return new Response(stream, {
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

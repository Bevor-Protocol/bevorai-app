import { streaming_api } from "@/lib/api";
import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const { message, chatId, attributes } = await req.json();

    const sessionToken = req.cookies.get("bevor-token")?.value;
    const teamId = req.cookies.get("bevor-team-id")?.value;

    if (!sessionToken) {
      throw new Error("invalidate token");
    }
    // Create a new ReadableStream for streaming the response
    const stream = new ReadableStream({
      async start(controller: ReadableStreamDefaultController): Promise<void> {
        try {
          // Make the API request to your backend
          const response = await streaming_api.post(
            `/chats/${chatId}`,
            {
              message,
              attributes,
            },
            {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
                "Bevor-Team-Id": teamId,
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

import { anthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = await streamText({
    model: anthropic("claude-3-5-sonnet-20240620"),
    messages: convertToCoreMessages(messages),
    system: "You are a helpful AI assistant",
  });

  return result.toDataStreamResponse();
}

import OpenAI from "openai"
import * as v from "valibot"
import { logger } from "$lib/telemetry/logger"
import { compose_system_prompt } from "./context.server"
import type { RequestHandler } from "./$types"

const MessageSchema = v.object({
  role: v.picklist(["user", "assistant"]),
  content: v.string(),
})

const RequestSchema = v.object({
  messages: v.array(MessageSchema),
})

function get_api_key(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error("OPENAI_API_KEY is not set")
  }
  return key
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const validation = v.safeParse(RequestSchema, body)
  if (!validation.success) {
    return new Response(
      JSON.stringify({ error: "Invalid request body" }),
      { status: 400 },
    )
  }

  const api_key = get_api_key()
  const client = new OpenAI({ apiKey: api_key })
  const system_prompt = compose_system_prompt()

  const stream = await client.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    stream: true,
    messages: [
      { role: "system", content: system_prompt },
      ...validation.output.messages,
    ],
  })

  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content
          if (text) {
            controller.enqueue(
              new TextEncoder().encode(text),
            )
          }
        }
        controller.close()
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error("stream failed")
        logger.error(err.message, {}, err)
        controller.error(err)
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  })
}

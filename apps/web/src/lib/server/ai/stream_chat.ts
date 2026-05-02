import OpenAI from "openai"
import { marked } from "marked"
import { logger } from "$lib/telemetry/logger"
import type { Message, StreamChunk } from "./types"

type StreamChatOptions = {
  system_prompt: string
  messages: Message[]
}

export function stream_chat(
  options: StreamChatOptions,
): Response {
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const key = process.env.OPENAI_API_KEY
        if (!key) {
          emit(controller, {
            type: "error",
            message: "Servicio de chat no disponible",
          })
          controller.close()
          return
        }

        const client = new OpenAI({ apiKey: key })

        const messages: OpenAI.ChatCompletionMessageParam[] =
          [
            {
              role: "system",
              content: options.system_prompt,
            },
            ...options.messages.map((message) => ({
              role: message.role as "user" | "assistant",
              content: message.content,
            })),
          ]

        const response =
          await client.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            max_tokens: 2048,
          })

        const text = response.choices[0]?.message?.content
        if (text) {
          const html = marked.parse(text, { async: false })
          emit(controller, { type: "text", content: html })
        }

        emit(controller, { type: "done" })
        controller.close()
      } catch (error) {
        const err =
          error instanceof Error
            ? error
            : new Error("Error en el chat")
        logger.error(err.message, {}, err)
        emit(controller, {
          type: "error",
          message: err.message,
        })
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  })
}

function emit(
  controller: ReadableStreamDefaultController,
  chunk: StreamChunk,
) {
  controller.enqueue(
    new TextEncoder().encode(JSON.stringify(chunk) + "\n"),
  )
}

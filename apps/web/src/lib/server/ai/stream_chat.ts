import OpenAI from "openai"
import { marked } from "marked"
import { logger } from "$lib/telemetry/logger"
import type { Message, StreamChunk } from "./types"
import type { ChatTool } from "./tools"

type StreamChatOptions = {
  system_prompt: string
  messages: Message[]
  tools: ChatTool[]
  execute_tool: (
    name: string,
    args: Record<string, unknown>,
  ) => string
  valid_urls: Set<string>
}

const MAX_TOOL_ROUNDS = 5

function sanitize_links(
  html: string,
  valid_urls: Set<string>,
): string {
  return html.replace(
    /<a\s+href="([^"]*)"[^>]*>(.*?)<\/a>/g,
    (_match, href: string, text: string) => {
      try {
        const url = new URL(href, "http://placeholder")
        const path = url.pathname
        if (valid_urls.has(path)) {
          return `<a href="${path}">${text}</a>`
        }
      } catch {
        // not a valid URL
      }
      if (valid_urls.has(href)) {
        return `<a href="${href}">${text}</a>`
      }
      return text
    },
  )
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

        for (
          let round = 0;
          round < MAX_TOOL_ROUNDS;
          round++
        ) {
          const response =
            await client.chat.completions.create({
              model: "gpt-4o-mini",
              messages,
              max_tokens: 2048,
              tools:
                options.tools as OpenAI.ChatCompletionTool[],
            })

          const choice = response.choices[0]
          if (!choice) break

          if (
            choice.finish_reason === "tool_calls" &&
            choice.message.tool_calls
          ) {
            messages.push(choice.message)

            for (const tool_call of choice.message
              .tool_calls) {
              if (tool_call.type !== "function") continue
              const args = JSON.parse(
                tool_call.function.arguments,
              ) as Record<string, unknown>
              const result = options.execute_tool(
                tool_call.function.name,
                args,
              )
              messages.push({
                role: "tool",
                tool_call_id: tool_call.id,
                content: result,
              })
            }

            continue
          }

          const text = choice.message.content
          if (text) {
            const html = marked.parse(text, {
              async: false,
            }) as string
            const sanitized = sanitize_links(
              html,
              options.valid_urls,
            )
            emit(controller, {
              type: "text",
              content: sanitized,
            })
          }

          break
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

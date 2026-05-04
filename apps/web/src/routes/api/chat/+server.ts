import * as v from "valibot"
import { ChatRequestSchema } from "$lib/server/ai/types"
import { stream_chat } from "$lib/server/ai/stream_chat"
import {
  compose_system_prompt,
  execute_tool,
  get_valid_urls,
  tool_definitions,
} from "./context.server"
import type { RequestHandler } from "./$types"

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json()
  const validation = v.safeParse(ChatRequestSchema, body)

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: "Solicitud inválida",
      }),
      { status: 400 },
    )
  }

  return stream_chat({
    system_prompt: compose_system_prompt(),
    messages: validation.output.messages,
    tools: tool_definitions,
    execute_tool,
    valid_urls: get_valid_urls(),
  })
}

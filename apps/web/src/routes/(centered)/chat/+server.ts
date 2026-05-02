import * as v from "valibot"
import { ChatRequestSchema } from "$lib/server/ai/types"
import { stream_chat } from "$lib/server/ai/stream_chat"
import type { RequestHandler } from "./$types"
import { compose_system_prompt } from "./context.server"

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

  const system_prompt = compose_system_prompt()

  return stream_chat({
    system_prompt,
    messages: validation.output.messages,
  })
}

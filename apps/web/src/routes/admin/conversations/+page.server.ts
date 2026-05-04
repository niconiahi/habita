import * as v from "valibot"
import { error } from "@sveltejs/kit"
import { require_authentication } from "$lib/server/auth"
import { is_webmaster } from "$lib/server/is_webmaster"
import { ForceNumberSchema } from "$lib/force_number"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_conversation_reply } from "./actions/create_conversation_reply.server"
import { fetch_conversations } from "./fetchers/conversations.server"
import { fetch_conversation_messages } from "./fetchers/conversation_messages.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)
  if (!is_webmaster(locals.user)) {
    error(403, "forbidden")
  }

  const conversations = await fetch_conversations()

  const selected_id_raw = url.searchParams.get("selected")
  let selected_messages: Awaited<
    ReturnType<typeof fetch_conversation_messages>
  > = []
  let selected_conversation_user_id: number | null = null

  if (selected_id_raw) {
    const selected_id = v.parse(
      ForceNumberSchema,
      selected_id_raw,
    )
    selected_messages =
      await fetch_conversation_messages(selected_id)
    const selected = conversations.find(
      (c) => c.id === selected_id,
    )
    if (selected) {
      selected_conversation_user_id = selected.user_id
    }
  }

  return {
    conversations,
    selected_messages,
    selected_conversation_user_id,
  }
}

export const actions: Actions = {
  [ACTION.CREATE_CONVERSATION_REPLY]: async ({
    request,
    locals,
  }) => {
    require_authentication(locals)
    if (!is_webmaster(locals.user)) {
      error(403, "forbidden")
    }
    const form_data = await request.formData()
    const [reply_errors] = await create_conversation_reply(
      form_data,
      locals.user.id,
    )
    if (reply_errors) {
      return { errors: reply_errors }
    }
    return null
  },
}

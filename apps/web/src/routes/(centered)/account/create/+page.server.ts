import { query_builder } from "db/query_builder"
import { require_authentication } from "$lib/server/auth"
import type { Actions, PageServerLoad } from "./$types"
import { ACTION } from "./actions/action"
import { create_account } from "./actions/create_account.server"

export const load: PageServerLoad = async ({
  locals,
  url,
}) => {
  require_authentication(locals, url)

  const existing_types = await query_builder
    .selectFrom("member")
    .innerJoin(
      "subscription",
      "subscription.organization_id",
      "member.organization_id",
    )
    .where("member.user_id", "=", locals.user.id)
    .select("subscription.type")
    .execute()

  return {
    existing_subscription_types: [
      ...new Set(existing_types.map((row) => row.type)),
    ],
  }
}

export const actions: Actions = {
  [ACTION.CREATE_ACCOUNT]: async ({
    locals,
    request,
  }) => {
    require_authentication(locals)
    const form_data = await request.formData()
    return create_account(
      form_data,
      locals.user.id,
      locals.user.email,
      request.headers,
    )
  },
}

import type { Route } from "./+types/accept-invite"
import * as v from "valibot"
import { compose_token_hash } from "./edit/actions/server/index.server"
import { query_builder } from "~/lib/server/query_builder.server"
import { now } from "~/lib/now"
import { ForceNumberSchema } from "~/lib/server/force_number.server"
import { ACCESS_TYPE } from "~/lib/access_type"
import { require_auth } from "~/lib/server/auth.server"

const ERROR_MESSAGE = "not found"

export async function loader({
  request,
  params,
}: Route.LoaderArgs) {
  const { user } = await require_auth(request)
  const url = new URL(request.url)
  const token = v.parse(
    v.string(),
    url.searchParams.get("token"),
  )
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const token_hash = compose_token_hash(token)
  const invitation = await query_builder
    .selectFrom("invitation_token")
    .where("invitation_token.token", "=", token_hash)
    .select([
      "invitation_token.used_at",
      "invitation_token.expires_at",
      "invitation_token.property_id",
      "invitation_token.email",
    ])
    .executeTakeFirst()
  if (!invitation) {
    return new Response(ERROR_MESSAGE, { status: 400 })
  }
  if (invitation.property_id !== property_id) {
    return new Response(ERROR_MESSAGE, { status: 400 })
  }
  if (invitation.expires_at.getTime() < Date.now()) {
    return new Response(ERROR_MESSAGE, { status: 400 })
  }
  if (invitation.used_at) {
    return new Response(ERROR_MESSAGE, { status: 400 })
  }
  if (user.email !== invitation.email) {
    return new Response(ERROR_MESSAGE, { status: 400 })
  }
  await query_builder.transaction().execute(async (tx) => {
    await tx
      .insertInto("access")
      .values({
        type: ACCESS_TYPE.OWNER,
        created_at: now,
        user_id: user.id,
        updated_at: now,
        property_id,
      })
      .executeTakeFirstOrThrow()
    await tx
      .updateTable("invitation_token")
      .set({ used_at: now })
      .where("invitation_token.token", "=", token_hash)
      .execute()
  })
}

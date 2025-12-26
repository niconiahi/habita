import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { compose_token_hash } from "$lib/server/token"
import { query_builder } from "db/query_builder"
import type { RequestHandler } from "./$types"

const ERROR_MESSAGE = "not found"

export const GET: RequestHandler = async ({
  url,
  params,
  locals,
}) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
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
  if (locals.user.email !== invitation.email) {
    return new Response(ERROR_MESSAGE, { status: 400 })
  }
  await query_builder.transaction().execute(async (tx) => {
    await tx
      .insertInto("access")
      .values({
        type: ACCESS_TYPE.OWNER,
        created_at: now,
        user_id: locals.user!.id,
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
  redirect(302, `/properties/${property_id}`)
}

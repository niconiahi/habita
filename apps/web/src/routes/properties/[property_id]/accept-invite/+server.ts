import { redirect } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { now } from "$lib/server/now"
import { compose_token_hash } from "$lib/server/token"
import { ACCESS_TYPE } from "$lib/access_type"
import { assign_property_access } from "$lib/server/property_access"
import { query_builder } from "db/query_builder"
import type { RequestHandler } from "./$types"

const ERROR_MESSAGE = "not found"

function strip_email_subaddress(email: string): string {
  const plus_index = email.indexOf("+")
  const at_index = email.indexOf("@")
  if (plus_index === -1 || plus_index > at_index) {
    return email
  }
  return email.slice(0, plus_index) + email.slice(at_index)
}

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
  const normalized_email = strip_email_subaddress(
    invitation.email,
  )
  if (locals.user.email !== normalized_email) {
    return new Response(ERROR_MESSAGE, { status: 400 })
  }
  const property = await query_builder
    .selectFrom("property")
    .where("id", "=", property_id)
    .select("id")
    .executeTakeFirst()
  if (!property) {
    return new Response(ERROR_MESSAGE, { status: 400 })
  }
  await assign_property_access(
    property_id,
    locals.user.id,
    ACCESS_TYPE.LANDLORD,
  )
  await query_builder
    .updateTable("invitation_token")
    .set({ used_at: now })
    .where("invitation_token.token", "=", token_hash)
    .execute()
  redirect(302, `/properties/${property_id}`)
}

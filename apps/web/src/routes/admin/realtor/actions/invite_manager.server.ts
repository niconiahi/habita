import * as v from "valibot"
import { query_builder } from "db/query_builder"

export async function invite_manager(
  form_data: FormData,
  organization_id: string,
  inviter_id: number,
) {
  const email = v.parse(
    v.pipe(v.string(), v.email()),
    form_data.get("email"),
  )

  const now = new Date()
  const invitation_id = crypto.randomUUID()
  const expires_at = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  ) // 7 days

  await query_builder
    .insertInto("invitation")
    .values({
      id: invitation_id,
      organization_id,
      email,
      role: "manager",
      status: "pending",
      inviter_id,
      expires_at,
      created_at: now,
      updated_at: now,
    })
    .execute()

  // TODO: Send invitation email
  console.log(`Invitation sent to ${email} for org ${organization_id}`)

  return { email }
}

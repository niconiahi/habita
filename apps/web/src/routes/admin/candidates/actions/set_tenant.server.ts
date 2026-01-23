import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import {
  add_user_to_property,
  remove_user_role_from_property,
} from "$lib/server/organizations"

export const InputSchema = v.object({
  candidate_id: ForceNumberSchema,
  property_id: ForceNumberSchema,
})

export async function set_tenant(form_data: FormData) {
  const { candidate_id, property_id } = v.parse(
    InputSchema,
    {
      candidate_id: form_data.get("candidate_id"),
      property_id: form_data.get("property_id"),
    },
  )
  await remove_user_role_from_property(
    property_id,
    "tenant",
  )
  await add_user_to_property(
    property_id,
    candidate_id,
    "tenant",
  )
  return { redirect_to: "/admin/candidates" }
}

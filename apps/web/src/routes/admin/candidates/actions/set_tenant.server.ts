import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { ACCESS_TYPE } from "$lib/access_type"
import {
  assign_property_access,
  revoke_all_access_by_type,
} from "$lib/server/property_access"

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
  await revoke_all_access_by_type(
    property_id,
    ACCESS_TYPE.TENANT,
  )
  await assign_property_access(
    property_id,
    candidate_id,
    ACCESS_TYPE.TENANT,
  )
  return { redirect_to: "/admin/candidates" }
}

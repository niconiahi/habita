import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { ACCESS_TYPE } from "$lib/access_type"
import {
  assign_property_access,
  revoke_all_access_by_type,
} from "$lib/server/property_access"

export async function reassign_property(form_data: FormData) {
  const property_id = v.parse(
    ForceNumberSchema,
    form_data.get("property_id"),
  )
  const manager_id_raw = form_data.get("manager_id")
  const manager_id = manager_id_raw
    ? v.parse(ForceNumberSchema, manager_id_raw)
    : null
  await revoke_all_access_by_type(property_id, ACCESS_TYPE.MANAGER)
  if (manager_id) {
    await assign_property_access(property_id, manager_id, ACCESS_TYPE.MANAGER)
  }
  return { property_id, manager_id }
}

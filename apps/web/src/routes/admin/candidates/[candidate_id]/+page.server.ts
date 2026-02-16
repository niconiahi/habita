import { redirect, error } from "@sveltejs/kit"
import * as v from "valibot"
import { ForceNumberSchema } from "$lib/force_number"
import { query_builder } from "db/query_builder"
import { SLOT_STATE } from "$lib/slot_state"
import { ACCESS_TYPE } from "$lib/access_type"
import { get_accessible_property_ids } from "$lib/server/property_access"
import { fetch_candidate } from "./fetchers/candidate.server"
import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({
  locals,
  params,
}) => {
  if (!locals.user) {
    redirect(302, "/auth/google")
  }
  const candidate_id = v.parse(
    ForceNumberSchema,
    params.candidate_id,
    {
      message: "candidate id should be a number",
    },
  )
  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.LANDLORD, ACCESS_TYPE.MANAGER],
    locals.session?.activeOrganizationId,
  )
  const candidate_slot = await query_builder
    .selectFrom("slot")
    .where("slot.visitant_id", "=", candidate_id)
    .where("slot.state", "=", SLOT_STATE.RESERVED)
    .where("slot.property_id", "in", property_ids)
    .select(["slot.id"])
    .executeTakeFirst()
  if (!candidate_slot) {
    error(403, "not authorized")
  }
  const candidate = await fetch_candidate(candidate_id)
  if (!candidate) {
    error(404, "candidate not found")
  }
  return { candidate }
}

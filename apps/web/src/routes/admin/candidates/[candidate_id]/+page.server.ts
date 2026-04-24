import { require_authentication } from "$lib/server/auth"
import { error } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { ACCESS_TYPE } from "$lib/access_type"
import { ForceNumberSchema } from "$lib/force_number"
import { get_accessible_property_ids } from "$lib/server/property_access"
import { SLOT_STATE } from "$lib/slot_state"
import type { PageServerLoad } from "./$types"
import {
  fetch_candidate,
  fetch_candidate_files,
} from "./fetchers/candidate.server"

export const load: PageServerLoad = async ({
  locals,
  params,
}) => {
  require_authentication(locals)
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
    locals.session.activeOrganizationId,
  )
  const candidate_slot = await query_builder
    .selectFrom("slot")
    .where("slot.visitant_id", "=", candidate_id)
    .where("slot.state", "in", [
      SLOT_STATE.RESERVED,
      SLOT_STATE.CONFIRMED,
    ])
    .where("slot.property_id", "in", property_ids)
    .select(["slot.id"])
    .executeTakeFirst()
  if (!candidate_slot) {
    error(403, "not authorized")
  }
  const [candidate, candidate_files] = await Promise.all([
    fetch_candidate(candidate_id),
    fetch_candidate_files(candidate_id),
  ])
  if (!candidate) {
    error(404, "candidate not found")
  }
  return { candidate, candidate_files }
}

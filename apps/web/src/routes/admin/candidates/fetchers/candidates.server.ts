import { jsonObjectFrom } from "kysely/helpers/postgres"
import { query_builder } from "db/query_builder"
import { SLOT_STATE } from "$lib/slot_state"
import { decrypt } from "$lib/server/encryption"

export async function fetch_candidates(property_ids: number[]) {
  const candidates = await query_builder
    .selectFrom("slot")
    .innerJoin("user", "user.id", "slot.visitant_id")
    .innerJoin(
      "property",
      "property.id",
      "slot.property_id",
    )
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("slot.property_id", "in", property_ids)
    .where("slot.state", "=", SLOT_STATE.RESERVED)
    .select((eb) => [
      "user.id",
      "user.name",
      "user.surname",
      "slot.start_date",
      "slot.end_date",
      "property.id as property_id",
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.id",
            "location.address",
            "location.latitude",
            "location.longitude",
            "location.road",
            "location.house_number",
            "location.suburb",
            "location.city",
            "location.town",
            "location.state",
          ])
          .whereRef(
            "location.id",
            "=",
            "property.location_id",
          ),
      )
        .$notNull()
        .as("location"),
    ])
    .execute()
  return candidates.map((candidate) => ({
    ...candidate,
    name: decrypt(candidate.name),
    surname: decrypt(candidate.surname),
  }))
}

export type Candidate = NonNullable<
  Awaited<ReturnType<typeof fetch_candidates>>[0]
>

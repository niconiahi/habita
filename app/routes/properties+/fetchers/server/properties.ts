import {
  jsonArrayFrom,
  jsonObjectFrom,
} from "kysely/helpers/postgres"
import { PROPERTY_STATE } from "~/lib/server/property_state"
import { query_builder } from "~/lib/server/query_builder"

export async function fetch_properties() {
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .select((eb) => [
      "property.id",
      "property.state",
      jsonArrayFrom(
        eb
          .selectFrom("room")
          .select([
            "room.id",
            "room.type",
            "room.width",
            "room.length",
          ])
          .whereRef("room.property_id", "=", "property.id"),
      ).as("rooms"),
      jsonObjectFrom(
        eb
          .selectFrom("location")
          .select([
            "location.address",
            "location.id",
            "location.latitude",
            "location.longitude",
            "location.road",
            "location.house_number",
            "location.state",
            "location.suburb",
            "location.city",
            "location.town",
          ])
          .whereRef(
            "location.id",
            "=",
            "property.location_id",
          ),
      )
        .$notNull()
        .as("location"),
      jsonArrayFrom(
        eb
          .selectFrom("contract")
          .select([
            "contract.id",
            "contract.start_date",
            "contract.end_date",
            "contract.state",
            "contract.duration",
            "contract.formula",
          ])
          .whereRef(
            "contract.property_id",
            "=",
            "property.id",
          ),
      ).as("contracts"),
    ])
    .where("property.state", "=", PROPERTY_STATE.PUBLISHED)
    .execute()
}
export type Property = NonNullable<
  Awaited<ReturnType<typeof fetch_properties>>[0]
>

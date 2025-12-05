import { jsonObjectFrom } from "kysely/helpers/postgres"
import { CONTRACT_STATE } from "~/lib/contract_state"
import { query_builder } from "~/lib/query_builder.server"

export async function fetch_contracts(admin_property_ids: number[]) {
  if (admin_property_ids.length === 0) {
    return []
  }
  return query_builder
    .selectFrom("contract")
    .innerJoin("property", "property.id", "contract.property_id")
    .innerJoin("location", "location.id", "property.location_id")
    .where("contract.property_id", "in", admin_property_ids)
    .where("contract.state", "in", [
      CONTRACT_STATE.EDITING,
      CONTRACT_STATE.ACTIVE,
    ])
    .select((eb) => [
      "contract.id",
      "contract.state",
      "contract.end_date",
      "contract.property_id",
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
          .whereRef("location.id", "=", "property.location_id"),
      )
        .$notNull()
        .as("location"),
    ])
    .execute()
}
export type Contract = NonNullable<
  Awaited<ReturnType<typeof fetch_contracts>>[0]
>

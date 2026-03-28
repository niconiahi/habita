import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { CONTRACT_STATE } from "$lib/contract_state"

export function fetch_available_properties(
  manager_property_ids: number[],
) {
  if (manager_property_ids.length === 0) {
    return Promise.resolve([])
  }
  return query_builder
    .selectFrom("property")
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("property.id", "in", manager_property_ids)
    .where(({ not, exists, selectFrom }) =>
      not(
        exists(
          selectFrom("contract")
            .whereRef(
              "contract.property_id",
              "=",
              "property.id",
            )
            .where("contract.state", "in", [
              CONTRACT_STATE.EDITING,
              CONTRACT_STATE.ACTIVE,
            ]),
        ),
      ),
    )
    .select((eb) => [
      "property.id",
      "property.unit",
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
}
export type AvailableProperty = NonNullable<
  Awaited<ReturnType<typeof fetch_available_properties>>[0]
>

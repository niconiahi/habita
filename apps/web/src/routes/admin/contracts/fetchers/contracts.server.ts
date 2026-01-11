import { jsonObjectFrom } from "kysely/helpers/postgres"
import {
  type ContractState,
  get_contract_states,
} from "$lib/contract_state"
import { ACCESS_TYPE } from "$lib/access_type"
import { query_builder } from "db/query_builder"

export function fetch_contracts(
  property_ids: number[],
  states?: ContractState[],
) {
  return query_builder
    .selectFrom("contract")
    .innerJoin(
      "property",
      "property.id",
      "contract.property_id",
    )
    .innerJoin(
      "location",
      "location.id",
      "property.location_id",
    )
    .where("contract.property_id", "in", property_ids)
    .where(
      "contract.state",
      "in",
      states ? states : get_contract_states(),
    )
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
          .whereRef(
            "location.id",
            "=",
            "property.location_id",
          ),
      )
        .$notNull()
        .as("location"),
      jsonObjectFrom(
        eb
          .selectFrom("user")
          .innerJoin("access", "access.user_id", "user.id")
          .select(["user.name", "user.surname"])
          .whereRef(
            "access.property_id",
            "=",
            "contract.property_id",
          )
          .where("access.type", "=", ACCESS_TYPE.TENANT),
      ).as("tenant"),
    ])
    .execute()
}

export type Contract = NonNullable<
  Awaited<ReturnType<typeof fetch_contracts>>[0]
>

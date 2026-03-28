import { query_builder } from "db/query_builder"
import { jsonObjectFrom } from "kysely/helpers/postgres"
import { ACCESS_TYPE } from "$lib/access_type"
import {
  type ContractState,
  get_contract_states,
} from "$lib/contract_state"
import { decrypt } from "$lib/server/encryption"

export async function fetch_contracts(
  property_ids: number[],
  states?: ContractState[],
) {
  if (property_ids.length === 0) return []
  const contracts = await query_builder
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
          .innerJoin(
            "property_access",
            "property_access.user_id",
            "user.id",
          )
          .select(["user.name", "user.surname"])
          .whereRef(
            "property_access.property_id",
            "=",
            "property.id",
          )
          .where(
            "property_access.type",
            "=",
            ACCESS_TYPE.TENANT,
          ),
      ).as("tenant"),
    ])
    .execute()
  return contracts.map((contract) => ({
    ...contract,
    tenant: contract.tenant
      ? {
          name: decrypt(contract.tenant.name),
          surname: decrypt(contract.tenant.surname),
        }
      : null,
  }))
}

export type Contract = NonNullable<
  Awaited<ReturnType<typeof fetch_contracts>>[0]
>

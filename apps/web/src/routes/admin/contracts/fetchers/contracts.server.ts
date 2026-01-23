import { jsonObjectFrom } from "kysely/helpers/postgres"
import {
  type ContractState,
  get_contract_states,
} from "$lib/contract_state"
import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_contracts(
  property_ids: number[],
  states?: ContractState[],
) {
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
          .innerJoin("member", "member.user_id", "user.id")
          .innerJoin(
            "property_organization",
            "property_organization.organization_id",
            "member.organization_id",
          )
          .select(["user.name", "user.surname"])
          .whereRef(
            "property_organization.property_id",
            "=",
            "contract.property_id",
          )
          .where("member.role", "=", "tenant"),
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

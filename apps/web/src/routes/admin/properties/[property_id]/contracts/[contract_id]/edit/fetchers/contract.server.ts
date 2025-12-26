import {
  jsonArrayFrom,
  jsonObjectFrom,
} from "kysely/helpers/postgres"
import { query_builder } from "db/query_builder"
import { decrypt } from "$lib/server/encryption"

export async function fetch_contract(id: number) {
  const contract = await query_builder
    .selectFrom("contract")
    .select((eb) => [
      "contract.id",
      "contract.start_date",
      "contract.end_date",
      "contract.state",
      "contract.destiny",
      "contract.default_type",
      "contract.default_amount",
      "contract.default_duration",
      "contract.escalation_type",
      "contract.escalation_duration",
      "contract.early_termination",
      "contract.fine_type",
      "contract.fine_amount",
      "contract.owner_location_id",
      "contract.tenant_location_id",
      "contract.cbu",
      "contract.percentage_return",
      "contract.showroom_hours",
      "contract.court_id",
      jsonArrayFrom(
        eb
          .selectFrom("period")
          .innerJoin(
            "contract",
            "contract.id",
            "period.contract_id",
          )
          .select([
            "period.id",
            "period.price",
            "period.start_date",
            "period.end_date",
          ])
          .where("period.contract_id", "=", id),
      ).as("periods"),
      jsonArrayFrom(
        eb
          .selectFrom("contract_file")
          .innerJoin(
            "file",
            "file.id",
            "contract_file.file_id",
          )
          .select([
            "file.basename",
            "file.id",
            "contract_file.type",
          ])
          .where("contract_file.contract_id", "=", id),
      ).as("files"),
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
            "contract.owner_location_id",
          ),
      ).as("owner_location"),
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
            "contract.tenant_location_id",
          ),
      ).as("tenant_location"),
    ])
    .where("contract.id", "=", id)
    .executeTakeFirst()
  if (!contract) return contract
  console.log('contract.tenant_location', contract.tenant_location)
  if (contract.tenant_location) {
    contract.tenant_location.road = decrypt(contract.tenant_location.road)
    contract.tenant_location.house_number = Number(decrypt(String(contract.tenant_location.house_number)))
  }
  console.log('contract.owner_location', contract.owner_location)
  if (contract.owner_location) {
    contract.owner_location.road = decrypt(contract.owner_location.road)
    contract.owner_location.house_number = Number(decrypt(String(contract.owner_location.house_number)))
  }
  return contract
}
export type Contract = NonNullable<
  Awaited<ReturnType<typeof fetch_contract>>
>

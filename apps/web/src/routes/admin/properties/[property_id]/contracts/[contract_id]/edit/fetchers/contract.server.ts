import { jsonArrayFrom } from "kysely/helpers/postgres"
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
    ])
    .where("contract.id", "=", id)
    .executeTakeFirst()
  if (!contract) return contract
  const tenant_location = contract.tenant_location_id
    ? await fetch_location(
        Number(decrypt(contract.tenant_location_id)),
      )
    : null
  const owner_location = contract.owner_location_id
    ? await fetch_location(
        Number(decrypt(contract.owner_location_id)),
      )
    : null
  return {
    ...contract,
    tenant_location,
    owner_location,
  }
}

async function fetch_location(id: number) {
  return query_builder
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
    .where("location.id", "=", id)
    .executeTakeFirst()
}

export type Contract = NonNullable<
  Awaited<ReturnType<typeof fetch_contract>>
>

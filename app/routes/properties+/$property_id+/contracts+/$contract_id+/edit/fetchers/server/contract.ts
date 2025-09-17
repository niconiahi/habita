import { jsonArrayFrom } from "kysely/helpers/postgres"
import { query_builder } from "~/lib/server/query_builder"

export async function fetch_contract(id: number) {
  return query_builder
    .selectFrom("contract")
    .select((eb) => [
      "contract.id",
      "contract.start_date",
      "contract.end_date",
      "contract.state",
      "contract.duration",
      "contract.formula",
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
    .executeTakeFirstOrThrow()
}
export type Contract = NonNullable<
  Awaited<ReturnType<typeof fetch_contract>>
>

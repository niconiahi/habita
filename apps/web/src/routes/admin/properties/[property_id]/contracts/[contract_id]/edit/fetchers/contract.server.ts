import { sql } from "kysely"
import { jsonArrayFrom, jsonObjectFrom } from "kysely/helpers/postgres"
import { query_builder } from "db/query_builder"

export async function fetch_contract(id: number) {
  return query_builder
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
      "contract.cbu",
      "contract.percentage_return",
      "contract.showroom_hours",
      "contract.court_id",
      "contract.warranty_id",
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
      jsonArrayFrom(
        eb
          .selectFrom("contract_item")
          .select((eb2) => [
            "contract_item.id",
            "contract_item.name",
            "contract_item.state",
            jsonArrayFrom(
              eb2
                .selectFrom("contract_item_file")
                .innerJoin(
                  "file",
                  "file.id",
                  "contract_item_file.file_id",
                )
                .select([
                  "file.id",
                  "file.basename",
                  sql<string>`encode(file.content, 'base64')`.as(
                    "content",
                  ),
                ])
                .whereRef(
                  "contract_item_file.contract_item_id",
                  "=",
                  "contract_item.id",
                ),
            ).as("files"),
          ])
          .where("contract_item.contract_id", "=", id),
      ).as("contract_items"),
    ])
    .where("contract.id", "=", id)
    .executeTakeFirst()
}

export type Contract = NonNullable<
  Awaited<ReturnType<typeof fetch_contract>>
>

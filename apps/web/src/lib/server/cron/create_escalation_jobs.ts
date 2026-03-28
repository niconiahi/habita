import { jsonArrayFrom } from "kysely/helpers/postgres"
import * as v from "valibot"
import { query_builder } from "../../../../db/query_builder"
import { CONTRACT_STATE } from "../../contract_state"
import { logger } from "../../telemetry/logger"
import { publish_calculate_escalation } from "../broker/producer/publish_calculate_escalation"
import { ForceDateSchema } from "../force_date"

async function fetch_contracts() {
  return query_builder
    .selectFrom("contract")
    .select([
      "contract.id",
      "contract.escalation_type",
      "contract.escalation_duration",
      (eb) =>
        jsonArrayFrom(
          eb
            .selectFrom("period")
            .selectAll()
            .whereRef(
              "period.contract_id",
              "=",
              "contract.id",
            )
            .orderBy("period.end_date", "desc"),
        ).as("periods"),
    ])
    .where("contract.state", "=", CONTRACT_STATE.ACTIVE)
    .execute()
}
export type Contract = NonNullable<
  Awaited<ReturnType<typeof fetch_contracts>>[0]
>

function get_due_contracts(contracts: Contract[]) {
  const today = new Date()
  return contracts.filter((contract) => {
    const latest_period = contract.periods[0]
    if (!latest_period) {
      throw new Error(
        "at least one period should exist for the contract",
      )
    }
    const end_date = v.parse(
      ForceDateSchema,
      latest_period.end_date,
    )
    return end_date <= today
  })
}

export async function create_escalation_jobs() {
  const contracts = await fetch_contracts()
  const due_contracts = get_due_contracts(contracts)
  logger.info("found active contracts with due periods", {
    due_contracts_count: due_contracts.length,
  })
  if (due_contracts.length === 0) {
    logger.info("no contracts due, skipping event publish")
    return { created: 0 }
  }

  await publish_calculate_escalation()

  logger.info("published calculate_escalation event")
  return { created: 1 }
}

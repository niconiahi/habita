import { query_builder } from "db/query_builder"
import { CONTRACT_STATE } from "~/lib/contract_state"
import { now } from "~/lib/now"
import { JOB_STATUS } from "~/lib/job_status"
import { JOB_TYPE } from "~/lib/job_type"
import { jsonArrayFrom } from "kysely/helpers/postgres"
import { ForceDateSchema } from "../force_date.server"
import * as v from "valibot"

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
  console.log(
    `found ${due_contracts.length} active contracts with due periods`,
  )
  if (due_contracts.length === 0) {
    console.log("no contracts due, skipping job creation")
    return { created: 0 }
  }
  const job = await query_builder
    .selectFrom("job")
    .select("id")
    .where("type", "=", JOB_TYPE.CALCULATE_PRICES)
    .where("status", "=", JOB_STATUS.PENDING)
    .executeTakeFirst()
  if (job) {
    console.log(
      "pending escalation job already exists, skipping",
    )
    return { created: 0 }
  }
  await query_builder
    .insertInto("job")
    .values({
      type: JOB_TYPE.CALCULATE_PRICES,
      status: JOB_STATUS.PENDING,
      scheduled_at: now,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log("created escalation job")
  return { created: 1 }
}

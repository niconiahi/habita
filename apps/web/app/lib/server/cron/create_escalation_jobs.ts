import { query_builder } from "~/../../db/query_builder"
import { CONTRACT_STATE } from "../contract_state"
import { now } from "~/lib/now"
import { JOB_STATUS } from "../utils/job_status"
import { jsonArrayFrom } from "kysely/helpers/postgres"
import { ForceDateSchema } from "../force_date"
import * as v from "valibot"

async function fetch_contracts() {
  return query_builder
    .selectFrom("contract")
    .select([
      "contract.id",
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

export async function create_escalation_jobs() {
  const today = new Date()
  const contracts = (await fetch_contracts()).filter(
    (contract) => {
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
    },
  )
  console.log(
    `found ${contracts.length} active contracts with due periods`,
  )
  if (contracts.length === 0) {
    console.log("no contracts due, skipping job creation")
    return { created: 0 }
  }
  const job = await query_builder
    .selectFrom("job")
    .select("id")
    .where("type", "=", "calculate_escalation")
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
      type: "calculate_escalation",
      status: JOB_STATUS.PENDING,
      scheduled_at: now,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log("created escalation job")
  return { created: 1 }
}

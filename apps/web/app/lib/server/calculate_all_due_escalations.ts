import { query_builder } from "~/../../db/query_builder"
import { CONTRACT_STATE } from "./contract_state"
import { now } from "~/lib/now"
import type { Duration } from "./duration"
import { addMonths, addDays } from "date-fns"
import type { Insertable } from "kysely"
import type { FormulaParameter, Period } from "db/types"
import * as v from "valibot"

async function fetch_rates() {
  return query_builder
    .selectFrom("rate")
    .selectAll()
    .execute()
}
export type Rate = NonNullable<
  Awaited<ReturnType<typeof fetch_rates>>[0]
>

async function fetch_contracts() {
  return query_builder
    .selectFrom("contract")
    .innerJoin(
      "period",
      "period.contract_id",
      "contract.id",
    )
    .select([
      "contract.id as contract_id",
      "contract.escalation_type",
      "contract.escalation_duration",
      "period.id as period_id",
      "period.price",
      "period.end_date",
    ])
    .where("contract.state", "=", CONTRACT_STATE.ACTIVE)
    .where("period.end_date", "<=", new Date())
    .distinctOn("contract.id")
    .orderBy("contract.id")
    .orderBy("period.end_date", "desc")
    .execute()
}
export type Contract = NonNullable<
  Awaited<ReturnType<typeof fetch_contracts>>[0]
>

export async function calculate_all_due_escalations() {
  const contracts = await fetch_contracts()
  if (contracts.length === 0) {
    return { processed: 0, failed: 0 }
  }
  const rates = await fetch_rates()
  const next_periods: Insertable<Period>[] = []
  const next_formula_parameters: Insertable<FormulaParameter>[] =
    []
  let failed_count = 0
  for (const contract of contracts) {
    try {
      const current_rate = get_current_rate(contract, rates)
      const old_rate = get_old_rate(contract, rates)
      const next_price = get_next_price(
        contract.price,
        current_rate.value,
        old_rate.value,
      )
      const period = make_period(contract, next_price)
      next_periods.push(period)
      const formula_parameters = make_formula_parameters(
        current_rate,
        old_rate,
      )
      next_formula_parameters.push(...formula_parameters)
    } catch (error) {
      console.error(
        `Failed for contract ${contract.contract_id}:`,
        error,
      )
      failed_count++
    }
  }
  if (next_periods.length === 0) {
    return { processed: 0, failed: failed_count }
  }
  await query_builder.transaction().execute(async (trx) => {
    const inserted_periods = await trx
      .insertInto("period")
      .values(next_periods)
      .returning("id")
      .execute()
    for (let i = 0; i < inserted_periods.length; i++) {
      next_formula_parameters[i * 2].period_id =
        inserted_periods[i].id
      next_formula_parameters[i * 2 + 1].period_id =
        inserted_periods[i].id
    }
    await trx
      .insertInto("formula_parameter")
      .values(next_formula_parameters)
      .execute()
  })
  return {
    processed: next_periods.length,
    failed: failed_count,
  }
}

function get_current_rate(
  contract: Contract,
  rates: Rate[],
): Rate {
  const current_date = new Date()
  let rate: Rate | undefined = undefined
  rate = rates.find(
    (rate) =>
      rate.type === contract.escalation_type &&
      rate.month === current_date.getMonth() + 1 &&
      rate.year === current_date.getFullYear(),
  )
  if (!rate) {
    throw new Error(
      `a rate should exist for current rate ${contract.escalation_type}`,
    )
  }
  return rate
}

function get_old_rate(contract: Contract, rates: Rate[]) {
  const current_date = new Date()
  const months_offset = parse_duration_to_months(
    contract.escalation_duration as Duration,
  )
  const past_date = addMonths(current_date, -months_offset)
  let rate: Rate | undefined = undefined
  rate = rates.find(
    (rate) =>
      rate.type === contract.escalation_type &&
      rate.month === past_date.getMonth() + 1 &&
      rate.year === past_date.getFullYear(),
  )
  if (!rate) {
    throw new Error(
      `a rate should exist for old rate ${contract.escalation_type}`,
    )
  }
  return rate
}

function get_next_price(
  current_price: string,
  current_rate: string,
  old_rate: string,
): number {
  return (
    Number.parseFloat(current_price) *
    (Number.parseFloat(current_rate) /
      Number.parseFloat(old_rate))
  )
}

function make_period(
  contract: Contract,
  next_price: number,
): Insertable<Period> {
  const prev_end_date = v.parse(
    v.instance(Date),
    contract.end_date,
  )
  const start_date = addDays(prev_end_date, 1)
  const end_date = add_duration(
    start_date,
    contract.escalation_duration as Duration,
  )
  return {
    contract_id: contract.contract_id,
    price: next_price.toString(),
    start_date,
    end_date,
    created_at: now,
    updated_at: now,
  }
}

function make_formula_parameters(
  current_rate: Rate,
  old_rate: Rate,
): Insertable<FormulaParameter>[] {
  return [
    {
      period_id: 1,
      key: `rate_current_${current_rate.month}_${current_rate.year}`,
      value: current_rate.value,
      created_at: now,
      updated_at: now,
    },
    {
      period_id: 1,
      key: `rate_past_${old_rate.month}_${old_rate.year}`,
      value: old_rate.value,
      created_at: now,
      updated_at: now,
    },
  ]
}

function parse_duration_to_months(
  duration: Duration,
): number {
  const match = duration.match(/P(\d+)M/)
  if (match) {
    return Number.parseInt(match[1], 10)
  }
  const year_match = duration.match(/P(\d+)Y/)
  if (year_match) {
    return Number.parseInt(year_match[1], 10) * 12
  }
  throw new Error(
    `Unsupported duration format: ${duration}`,
  )
}

function add_duration(
  date: Date,
  duration: Duration,
): Date {
  const months_match = duration.match(/P(\d+)M/)
  if (months_match) {
    return addMonths(
      date,
      Number.parseInt(months_match[1], 10),
    )
  }
  const years_match = duration.match(/P(\d+)Y/)
  if (years_match) {
    return addMonths(
      date,
      Number.parseInt(years_match[1], 10) * 12,
    )
  }
  const days_match = duration.match(/P(\d+)D/)
  if (days_match) {
    return addDays(date, Number.parseInt(days_match[1], 10))
  }
  const weeks_match = duration.match(/P(\d+)W/)
  if (weeks_match) {
    return addDays(
      date,
      Number.parseInt(weeks_match[1], 10) * 7,
    )
  }
  throw new Error(
    `Unsupported duration format: ${duration}`,
  )
}

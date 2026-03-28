/**
 * RATES - Shared dependency for all cases
 *
 * Seeds rate values (IPC, ICL, UVA, CAC, CER, IS, IPIM, Casa Propia)
 * needed for contract escalation calculations.
 *
 * Values don't need to be historically accurate - just need to exist
 * so the escalation job can run successfully.
 */

import { subMonths } from "date-fns"
import type { Kysely } from "kysely"
import { get_month, get_year } from "../../src/lib/date"
import { RATE_TYPE } from "../../src/lib/rate_type"
import * as seeder from "../../src/lib/seeder"
import type { DB } from "../types"

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log("seeding rates")
  const date = new Date()

  const rate_types = [
    RATE_TYPE.IPC,
    RATE_TYPE.ICL,
    RATE_TYPE.UVA,
    RATE_TYPE.CAC,
    RATE_TYPE.CER,
    RATE_TYPE.IS,
    RATE_TYPE.IPIM,
    RATE_TYPE.CASA_PROPIA,
  ]

  // Create rates for current month and past 6 months
  for (const type of rate_types) {
    for (let i = 0; i <= 6; i++) {
      const rate_date = subMonths(date, i)
      // Simulate slight monthly variation (1.0 to 1.5 range)
      const base_value = 1.0 + i * 0.05 + type * 0.02
      await seeder.create_rate({
        type,
        month: get_month(rate_date),
        year: get_year(rate_date),
        value: base_value.toFixed(2),
      })
    }
  }

  console.log("rates seeding complete")
}

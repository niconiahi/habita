/**
 * CASE D: Fresh Manager (Empty State)
 *
 * Scenario: A new manager who just signed up.
 *
 * - New manager user account
 * - Zero properties
 * - Zero contracts
 * - Profile partially filled (missing some optional fields)
 *
 * Use this case to test empty state UI across admin routes:
 * - /admin/properties (empty table)
 * - /admin/contracts (empty table)
 * - /admin/candidates (empty table)
 * - /admin/tenants (empty table)
 */

import type { Kysely } from "kysely"
import type { DB } from "../types"
import * as seeder from "../../src/lib/seeder"

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log("seeding case_d: fresh manager (empty state)")

  // Create a new manager with minimal data (no credit report, no documents)
  await seeder.create_user({
    name: "Diego",
    surname: "Ramírez",
    email: "nicolas.accetta+d_manager@gmail.com",
    phone_number: "+5491155004001",
    document_number: 32109876,
  })

  // No properties, contracts, or anything else
  // This user exists purely to test empty states

  console.log("case_d seeding complete")
}

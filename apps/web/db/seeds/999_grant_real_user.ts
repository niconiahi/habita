/**
 * SETUP: Grant Real User Access
 *
 * This seed should be run AFTER you've logged in once via Google OAuth.
 * It grants your real account (nicolas.accetta@gmail.com) manager access
 * to all seeded properties so you can test the full application.
 *
 * Run with: pnpm kysely seed run --specific=999_grant_real_user
 *
 * Prerequisites:
 * 1. Run all other seeds first (pnpm kysely seed run)
 * 2. Log in once with Google OAuth to create your account
 * 3. Then run this seed to grant yourself access
 */

import type { Kysely } from "kysely"
import { ACCESS_TYPE } from "../../src/lib/access_type"
import * as seeder from "../../src/lib/seeder"
import type { DB } from "../types"

const REAL_USER_EMAIL = "nicolas.accetta@gmail.com"

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log(
    "granting real user access to seeded properties",
  )

  // Find all properties
  const { query_builder } = await import("../query_builder")
  const properties = await query_builder
    .selectFrom("property")
    .select("id")
    .execute()

  if (properties.length === 0) {
    console.log(
      "no properties found - run other seeds first",
    )
    return
  }

  // Grant manager access to each property
  for (const property of properties) {
    await seeder.grant_access_by_email(
      property.id,
      REAL_USER_EMAIL,
      ACCESS_TYPE.MANAGER,
    )
  }

  console.log(
    `granted manager access to ${properties.length} properties`,
  )
}

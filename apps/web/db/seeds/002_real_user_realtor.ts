/**
 * SETUP: Add Real User to a Realtor Organization
 *
 * Creates a realtor organization and adds the real user as a manager.
 * This gives the real user two organizations (Personal + Realtor) so
 * the organization selector becomes visible in the header.
 */

import type { Kysely } from "kysely"
import type { DB } from "../types"
import * as seeder from "../../src/lib/seeder"

const REAL_USER_EMAIL = "nicolas.accetta@gmail.com"

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log("adding real user to a realtor organization")

  const real_user_id =
    await seeder.find_user_by_email(REAL_USER_EMAIL)
  if (!real_user_id) {
    console.log("real user not found, skipping")
    return
  }

  const organization_id = await seeder.create_organization(
    "Inmobiliaria Demo",
  )

  await seeder.add_member(
    organization_id,
    real_user_id,
    "manager",
  )

  console.log(
    "added real user as manager to Inmobiliaria Demo",
  )
}

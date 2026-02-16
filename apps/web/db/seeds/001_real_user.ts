/**
 * SETUP: Create Real User Account
 *
 * Creates the real user account (nicolas.accetta@gmail.com) before other seeds run.
 * When you log in with Google OAuth, Better Auth will find this existing user
 * and link your Google account to it (instead of creating a new user).
 *
 * This also creates the organization and membership that Better Auth's hook
 * would normally create, so everything is ready for OAuth login.
 */

import type { Kysely } from "kysely"
import type { DB } from "../types"
import { encrypt } from "../../src/lib/server/encryption"

const REAL_USER_EMAIL = "nicolas.accetta@gmail.com"
const REAL_USER_NAME = "Nicolas"
const REAL_USER_SURNAME = "Accetta"

export async function seed(db: Kysely<DB>): Promise<void> {
  console.log("creating real user account")
  const now = new Date().toISOString()

  // Check if user already exists
  const existing = await db
    .selectFrom("user")
    .select("id")
    .where("email", "=", REAL_USER_EMAIL)
    .executeTakeFirst()

  if (existing) {
    console.log(
      `user ${REAL_USER_EMAIL} already exists, skipping`,
    )
    return
  }

  // Create the user
  const user = await db
    .insertInto("user")
    .values({
      email: REAL_USER_EMAIL,
      name: encrypt(REAL_USER_NAME),
      surname: encrypt(REAL_USER_SURNAME),
      email_verified: false,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  console.log(
    `created user ${REAL_USER_EMAIL} with id ${user.id}`,
  )

  // Create organization (mimicking Better Auth's hook)
  const orgId = crypto.randomUUID()
  const orgSlug = `personal-${user.id}`

  await db
    .insertInto("organization")
    .values({
      id: orgId,
      name: `Personal: ${REAL_USER_EMAIL}`,
      slug: orgSlug,
      created_at: now,
      updated_at: now,
    })
    .execute()

  console.log(`created organization with slug ${orgSlug}`)

  // Create membership (user as manager of their own org)
  const memberId = crypto.randomUUID()

  await db
    .insertInto("member")
    .values({
      id: memberId,
      organization_id: orgId,
      user_id: user.id,
      role: "manager",
      created_at: now,
      updated_at: now,
    })
    .execute()

  console.log(`created membership for user in organization`)

  // Create team (mimicking Better Auth's organization hook)
  const teamId = crypto.randomUUID()

  await db
    .insertInto("team")
    .values({
      id: teamId,
      name: "Principal",
      organization_id: orgId,
      created_at: now,
      updated_at: now,
    })
    .execute()

  console.log(`created team "Principal" in organization`)
  console.log("real user setup complete")
}

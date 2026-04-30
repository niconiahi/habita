/**
 * E2E Test Users
 *
 * Creates the test users needed by Playwright e2e tests.
 * Users are created with email_verified=true and proper password hashes
 * so they can login directly without email verification.
 *
 * Must run BEFORE other seeds since some reference users.
 */

import type { Kysely } from "kysely"
import { hashPassword } from "better-auth/crypto"
import { encrypt } from "../../src/lib/server/encryption"
import type { DB } from "../types"

const TEST_PASSWORD = "testpassword123"

const TEST_USERS = [
  {
    email: "test-manager@habita.test",
    name: "Test",
    surname: "Manager",
  },
  {
    email: "test-candidate@habita.test",
    name: "Test",
    surname: "Candidate",
  },
  {
    email: "test-landlord@habita.test",
    name: "Test",
    surname: "Landlord",
  },
]

export async function seed(db: Kysely<DB>): Promise<void> {
  const now = new Date().toISOString()
  const hashed_password = await hashPassword(TEST_PASSWORD)

  for (const test_user of TEST_USERS) {
    const existing = await db
      .selectFrom("user")
      .select("id")
      .where("email", "=", test_user.email)
      .executeTakeFirst()

    if (existing) {
      console.log(
        `test user ${test_user.email} already exists, skipping`,
      )
      continue
    }

    const user = await db
      .insertInto("user")
      .values({
        email: test_user.email,
        name: encrypt(test_user.name),
        surname: encrypt(test_user.surname),
        image: "/images/default-avatar.svg",
        email_verified: true,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    const account_id = crypto.randomUUID()
    await db
      .insertInto("account")
      .values({
        id: account_id,
        user_id: user.id,
        account_id: String(user.id),
        provider_id: "credential",
        password: hashed_password,
        created_at: now,
        updated_at: now,
      })
      .execute()

    const organization_id = crypto.randomUUID()
    await db
      .insertInto("organization")
      .values({
        id: organization_id,
        name: `Personal: ${test_user.email}`,
        slug: `personal-${user.id}`,
        created_at: now,
        updated_at: now,
      })
      .execute()

    const member_id = crypto.randomUUID()
    await db
      .insertInto("member")
      .values({
        id: member_id,
        organization_id,
        user_id: user.id,
        role: "manager",
        created_at: now,
        updated_at: now,
      })
      .execute()

    const team_id = crypto.randomUUID()
    await db
      .insertInto("team")
      .values({
        id: team_id,
        name: "Principal",
        organization_id,
        created_at: now,
        updated_at: now,
      })
      .execute()

    console.log(
      `created test user ${test_user.email} (id: ${user.id})`,
    )
  }
}

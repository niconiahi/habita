import { USER_FILE_TYPE } from "$lib/user_file_type"
import { query_builder } from "../../db/query_builder"
import { encrypt } from "../../src/lib/server/encryption"
import type { TestUser } from "./auth"

export interface TestUserRecord {
  user_id: number
  organization_id: string
  member_id: string
  team_id: string
}

export async function create_test_user(
  test_user: TestUser,
): Promise<TestUserRecord> {
  const now = new Date().toISOString()

  const existing = await query_builder
    .selectFrom("user")
    .select("id")
    .where("email", "=", test_user.email)
    .executeTakeFirst()

  let user_id: number

  if (existing) {
    user_id = existing.id
  } else {
    const user = await query_builder
      .insertInto("user")
      .values({
        email: test_user.email,
        name: encrypt(test_user.name),
        surname: encrypt(test_user.surname),
        phone_number: encrypt(test_user.phoneNumber),
        document_number: encrypt(
          String(test_user.documentNumber),
        ),
        email_verified: true,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()

    user_id = user.id
  }

  const org_slug = `personal-${user_id}`
  let organization = await query_builder
    .selectFrom("organization")
    .select("id")
    .where("slug", "=", org_slug)
    .executeTakeFirst()

  let organization_id: string

  if (organization) {
    organization_id = organization.id
  } else {
    organization_id = crypto.randomUUID()
    await query_builder
      .insertInto("organization")
      .values({
        id: organization_id,
        name: `Personal: ${test_user.email}`,
        slug: org_slug,
        created_at: now,
        updated_at: now,
      })
      .execute()
  }

  let member = await query_builder
    .selectFrom("member")
    .select("id")
    .where("user_id", "=", user_id)
    .where("organization_id", "=", organization_id)
    .executeTakeFirst()

  let member_id: string

  if (member) {
    member_id = member.id
  } else {
    member_id = crypto.randomUUID()
    await query_builder
      .insertInto("member")
      .values({
        id: member_id,
        organization_id: organization_id,
        user_id: user_id,
        role: "manager",
        created_at: now,
        updated_at: now,
      })
      .execute()
  }

  let team = await query_builder
    .selectFrom("team")
    .select("id")
    .where("organization_id", "=", organization_id)
    .executeTakeFirst()

  let team_id: string

  if (team) {
    team_id = team.id
  } else {
    team_id = crypto.randomUUID()
    await query_builder
      .insertInto("team")
      .values({
        id: team_id,
        name: "Principal",
        organization_id: organization_id,
        created_at: now,
        updated_at: now,
      })
      .execute()
  }

  return {
    user_id,
    organization_id,
    member_id,
    team_id,
  }
}

export async function create_test_session(
  user_id: number,
  organization_id: string,
  team_id: string,
): Promise<{
  session_id: string
  token: string
  expires_at: Date
}> {
  const now = new Date()
  const expires_at = new Date(
    now.getTime() + 7 * 24 * 60 * 60 * 1000,
  )

  const session_id = crypto.randomUUID()
  const token = crypto.randomUUID()

  await query_builder
    .insertInto("session")
    .values({
      id: session_id,
      token: token,
      user_id: user_id,
      activeOrganizationId: organization_id,
      activeTeamId: team_id,
      expires_at: expires_at.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    })
    .onConflict((oc) => oc.column("id").doNothing())
    .execute()

  return {
    session_id,
    token,
    expires_at,
  }
}

export async function cleanup_test_sessions(): Promise<void> {
  await query_builder
    .deleteFrom("session")
    .where(
      "user_id",
      "in",
      query_builder
        .selectFrom("user")
        .select("id")
        .where("email", "like", "test-%@habita.test"),
    )
    .execute()
}

export async function cleanup_test_data(): Promise<void> {
  await cleanup_test_sessions()
}

export async function create_credit_report(
  user_id: number,
): Promise<number> {
  const now = new Date().toISOString()
  const dummy_content = Buffer.from(
    "dummy credit report content",
  )

  const file = await query_builder
    .insertInto("file")
    .values({
      basename: "credit_report.pdf",
      content: dummy_content,
      hash: `test_hash_${user_id}_${Date.now()}`,
      mime: "application/pdf",
      size: dummy_content.length,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

  await query_builder
    .insertInto("user_file")
    .values({
      user_id,
      file_id: file.id,
      type: USER_FILE_TYPE.CREDIT_REPORT,
      created_at: now,
      updated_at: now,
    })
    .execute()

  return file.id
}

export async function assign_property_access(
  property_id: number,
  user_id: number,
  access_type: number,
): Promise<void> {
  const now = new Date().toISOString()
  await query_builder
    .insertInto("property_access")
    .values({
      property_id,
      user_id,
      type: access_type,
      created_at: now,
      updated_at: now,
    })
    .onConflict((oc) =>
      oc
        .columns(["property_id", "user_id", "type"])
        .doNothing(),
    )
    .execute()
}

export async function get_user_id_by_email(
  email: string,
): Promise<number | undefined> {
  const user = await query_builder
    .selectFrom("user")
    .select("id")
    .where("email", "=", email)
    .executeTakeFirst()
  return user?.id
}

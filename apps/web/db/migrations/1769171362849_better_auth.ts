import { sql, type Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("account")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("account_id", "text", (col) => col.notNull())
    .addColumn("provider_id", "text", (col) =>
      col.notNull(),
    )
    .addColumn("access_token", "text")
    .addColumn("refresh_token", "text")
    .addColumn("access_token_expires_at", "timestamptz")
    .addColumn("refresh_token_expires_at", "timestamptz")
    .addColumn("scope", "text")
    .addColumn("id_token", "text")
    .addColumn("password", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
  await db.schema
    .createTable("verification")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("identifier", "text", (col) => col.notNull())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("expires_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
  await db.schema
    .createTable("organization")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("slug", "text", (col) => col.unique())
    .addColumn("logo", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
  await db.schema
    .createTable("member")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("organization_id", "text", (col) =>
      col.notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("role", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
  await db.schema
    .createTable("invitation")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("organization_id", "text", (col) =>
      col.notNull(),
    )
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("role", "text", (col) => col.notNull())
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("expires_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("inviter_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
  await db.schema
    .createTable("team")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("organization_id", "text", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
  await db.schema
    .createTable("team_member")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("team_id", "text", (col) => col.notNull())
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()
  await db.schema
    .alterTable("user")
    .addColumn("email_verified", "boolean", (col) =>
      col.defaultTo(false),
    )
    .execute()
  await db.schema
    .alterTable("user")
    .addColumn("image", "text")
    .execute()
  await db.schema
    .alterTable("session")
    .addColumn("token", "text", (col) => col.unique())
    .execute()
  await db.schema
    .alterTable("session")
    .addColumn("ip_address", "text")
    .execute()
  await db.schema
    .alterTable("session")
    .addColumn("user_agent", "text")
    .execute()
  await db.schema
    .alterTable("session")
    .addColumn("activeOrganizationId", "text")
    .execute()
  await db.schema
    .alterTable("session")
    .addColumn("activeTeamId", "text")
    .execute()
  await db.schema
    .alterTable("account")
    .addForeignKeyConstraint(
      "account_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("member")
    .addForeignKeyConstraint(
      "member_organization_id_organization_id_fk",
      ["organization_id"],
      "organization",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("member")
    .addForeignKeyConstraint(
      "member_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("invitation")
    .addForeignKeyConstraint(
      "invitation_organization_id_organization_id_fk",
      ["organization_id"],
      "organization",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("invitation")
    .addForeignKeyConstraint(
      "invitation_inviter_id_user_id_fk",
      ["inviter_id"],
      "user",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("team")
    .addForeignKeyConstraint(
      "team_organization_id_organization_id_fk",
      ["organization_id"],
      "organization",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("team_member")
    .addForeignKeyConstraint(
      "team_member_team_id_team_id_fk",
      ["team_id"],
      "team",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("team_member")
    .addForeignKeyConstraint(
      "team_member_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()
  await db.schema
    .createIndex("idx_account_user_id")
    .on("account")
    .column("user_id")
    .execute()
  await db.schema
    .createIndex("idx_member_organization_id")
    .on("member")
    .column("organization_id")
    .execute()
  await db.schema
    .createIndex("idx_member_user_id")
    .on("member")
    .column("user_id")
    .execute()
  await db.schema
    .createIndex("idx_invitation_organization_id")
    .on("invitation")
    .column("organization_id")
    .execute()
  await db.schema
    .createIndex("idx_invitation_inviter_id")
    .on("invitation")
    .column("inviter_id")
    .execute()
  await db.schema
    .createIndex("idx_team_organization_id")
    .on("team")
    .column("organization_id")
    .execute()
  await db.schema
    .createIndex("idx_team_member_team_id")
    .on("team_member")
    .column("team_id")
    .execute()
  await db.schema
    .createIndex("idx_team_member_user_id")
    .on("team_member")
    .column("user_id")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("access")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("property_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()
  await db.schema
    .alterTable("access")
    .addForeignKeyConstraint(
      "access_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("access")
    .addForeignKeyConstraint(
      "access_property_id_property_id_fk",
      ["property_id"],
      "property",
      ["id"],
    )
    .execute()
  await db.schema
    .dropTable("invitation")
    .ifExists()
    .execute()
  await db.schema.dropTable("member").ifExists().execute()
  await db.schema
    .dropTable("team_member")
    .ifExists()
    .execute()
  await db.schema.dropTable("team").ifExists().execute()
  await db.schema
    .dropTable("organization")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("verification")
    .ifExists()
    .execute()
  await db.schema.dropTable("account").ifExists().execute()
  await db.schema
    .alterTable("session")
    .dropColumn("token")
    .execute()
  await db.schema
    .alterTable("session")
    .dropColumn("ip_address")
    .execute()
  await db.schema
    .alterTable("session")
    .dropColumn("user_agent")
    .execute()
  await db.schema
    .alterTable("session")
    .dropColumn("activeOrganizationId")
    .execute()
  await db.schema
    .alterTable("session")
    .dropColumn("activeTeamId")
    .execute()
  await db.schema
    .alterTable("user")
    .dropColumn("email_verified")
    .execute()
  await db.schema
    .alterTable("user")
    .dropColumn("image")
    .execute()
}

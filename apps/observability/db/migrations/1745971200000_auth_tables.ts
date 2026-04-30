// biome-ignore-all lint/suspicious/noExplicitAny: migration files need "any" type for Kysely
import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("user")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("email", "text", (col) =>
      col.notNull().unique(),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("email_verified", "boolean", (col) =>
      col.defaultTo(false),
    )
    .addColumn("image", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable("session")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "text", (col) => col.notNull())
    .addColumn("token", "text", (col) =>
      col.notNull().unique(),
    )
    .addColumn("expires_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("ip_address", "text")
    .addColumn("user_agent", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable("account")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "text", (col) => col.notNull())
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
    .alterTable("session")
    .addForeignKeyConstraint(
      "session_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  await db.schema
    .alterTable("account")
    .addForeignKeyConstraint(
      "account_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  await db.schema
    .createIndex("idx_account_user_id")
    .on("account")
    .column("user_id")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("account").ifExists().execute()
  await db.schema.dropTable("session").ifExists().execute()
  await db.schema
    .dropTable("verification")
    .ifExists()
    .execute()
  await db.schema.dropTable("user").ifExists().execute()
}

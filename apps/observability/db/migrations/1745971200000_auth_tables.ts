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
    .addColumn("emailVerified", "boolean", (col) =>
      col.defaultTo(false),
    )
    .addColumn("image", "text")
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable("session")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("userId", "text", (col) => col.notNull())
    .addColumn("token", "text", (col) =>
      col.notNull().unique(),
    )
    .addColumn("expiresAt", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("ipAddress", "text")
    .addColumn("userAgent", "text")
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .createTable("account")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("userId", "text", (col) => col.notNull())
    .addColumn("accountId", "text", (col) => col.notNull())
    .addColumn("providerId", "text", (col) =>
      col.notNull(),
    )
    .addColumn("accessToken", "text")
    .addColumn("refreshToken", "text")
    .addColumn("accessTokenExpiresAt", "timestamptz")
    .addColumn("refreshTokenExpiresAt", "timestamptz")
    .addColumn("scope", "text")
    .addColumn("idToken", "text")
    .addColumn("password", "text")
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
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
    .addColumn("expiresAt", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("createdAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updatedAt", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute()

  await db.schema
    .alterTable("session")
    .addForeignKeyConstraint(
      "session_userId_user_id_fk",
      ["userId"],
      "user",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  await db.schema
    .alterTable("account")
    .addForeignKeyConstraint(
      "account_userId_user_id_fk",
      ["userId"],
      "user",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  await db.schema
    .createIndex("idx_account_userId")
    .on("account")
    .column("userId")
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

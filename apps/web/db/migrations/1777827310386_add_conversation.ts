// biome-ignore-all lint/suspicious/noExplicitAny: migration files need "any" type for Kysely
import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("conversation")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .alterTable("conversation")
    .addForeignKeyConstraint(
      "conversation_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()

  await db.schema
    .createIndex("idx_conversation_user_id")
    .on("conversation")
    .column("user_id")
    .unique()
    .execute()

  await db.schema
    .createTable("conversation_message")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("conversation_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("message", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .alterTable("conversation_message")
    .addForeignKeyConstraint(
      "conversation_message_conversation_id_conversation_id_fk",
      ["conversation_id"],
      "conversation",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("conversation_message")
    .addForeignKeyConstraint(
      "conversation_message_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()

  await db.schema
    .createIndex("idx_conversation_message_conversation_id")
    .on("conversation_message")
    .column("conversation_id")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("conversation_message")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("conversation")
    .ifExists()
    .execute()
}

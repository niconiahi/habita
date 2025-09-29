import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("file")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("basename", "text", (col) => col.notNull())
    .addColumn("mime", "text", (col) => col.notNull())
    .addColumn("content", "bytea", (col) => col.notNull())
    .addColumn("size", "bigint", (col) => col.notNull())
    .addColumn("hash", "text", (col) =>
      col.notNull().unique(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("user_file")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("file_id", "integer", (col) => col.notNull())
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("contract_file")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("contract_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("file_id", "integer", (col) => col.notNull())
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .alterTable("contract_file")
    .addForeignKeyConstraint(
      "contract_file_contract_id_contract_id_fk",
      ["contract_id"],
      "contract",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("contract_file")
    .addForeignKeyConstraint(
      "contract_file_file_id_file_id_fk",
      ["file_id"],
      "file",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("contract_file")
    .addForeignKeyConstraint(
      "contract_file_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("contract_file")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("user_file")
    .ifExists()
    .execute()
  await db.schema.dropTable("file").ifExists().execute()
}

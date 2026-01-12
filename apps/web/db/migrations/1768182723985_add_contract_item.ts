import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("contract_item")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("contract_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("state", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("contract_item_file")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("contract_item_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("file_id", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .alterTable("contract_item")
    .addForeignKeyConstraint(
      "contract_item_contract_id_contract_id_fk",
      ["contract_id"],
      "contract",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("contract_item_file")
    .addForeignKeyConstraint(
      "contract_item_file_contract_item_id_contract_item_id_fk",
      ["contract_item_id"],
      "contract_item",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  await db.schema
    .alterTable("contract_item_file")
    .addForeignKeyConstraint(
      "contract_item_file_file_id_file_id_fk",
      ["file_id"],
      "file",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("contract_item_file")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("contract_item")
    .ifExists()
    .execute()
}

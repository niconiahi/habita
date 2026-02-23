import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("digital_signature")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("contract_id", "integer", (col) =>
      col.notNull().unique(),
    )
    .addColumn("document_id", "text")
    .addColumn("group_id", "text")
    .addColumn("landlord_url", "text")
    .addColumn("tenant_url", "text")
    .addColumn("landlord_status", "text", (col) =>
      col.notNull(),
    )
    .addColumn("tenant_status", "text", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()
  await db.schema
    .alterTable("digital_signature")
    .addForeignKeyConstraint(
      "digital_signature_contract_id_contract_id_fk",
      ["contract_id"],
      "contract",
      ["id"],
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("digital_signature")
    .ifExists()
    .execute()
}

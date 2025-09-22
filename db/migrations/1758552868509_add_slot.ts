import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("slot")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("host_id", "integer", (col) => col.notNull())
    .addColumn("visitant_id", "integer")
    .addColumn("state", "integer", (col) => col.notNull())
    .addColumn("event_id", "text", (col) => col.notNull())
    .addColumn("start_date", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("end_date", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("slot").ifExists().execute()
}

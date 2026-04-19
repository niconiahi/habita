import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("notification")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("href", "text", (col) => col.notNull())
    .addColumn("property_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("read_at", "timestamptz")
    .execute()

  await db.schema
    .alterTable("notification")
    .addForeignKeyConstraint(
      "notification_property_id_property_id_fk",
      ["property_id"],
      "property",
      ["id"],
    )
    .execute()
  await db.schema
    .createIndex("idx_notification_property_id")
    .on("notification")
    .column("property_id")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("notification")
    .ifExists()
    .execute()
}

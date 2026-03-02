import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("property_tag")
    .addColumn("id", "serial", (col) => col.primaryKey())
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
    .alterTable("property_tag")
    .addForeignKeyConstraint(
      "property_tag_property_id_property_id_fk",
      ["property_id"],
      "property",
      ["id"],
    )
    .execute()
  await db.schema
    .createIndex("property_tag_property_id_idx")
    .on("property_tag")
    .column("property_id")
    .execute()
  await db.schema
    .createIndex("property_tag_property_id_type_unique_idx")
    .unique()
    .on("property_tag")
    .columns(["property_id", "type"])
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("property_tag")
    .ifExists()
    .execute()
}

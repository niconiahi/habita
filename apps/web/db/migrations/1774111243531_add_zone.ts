import { sql, type Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("zone")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("admin_level", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("label", "text", (col) => col.notNull())
    .addColumn("badge", "text", (col) => col.notNull())
    .addColumn("geometry", sql`geometry(Geometry, 4326)`, (col) =>
      col.notNull(),
    )
    .addUniqueConstraint("zone_name_level_label_unique", [
      "name",
      "admin_level",
      "label",
    ])
    .execute()

  await db.schema
    .createIndex("zone_geometry_gist")
    .on("zone")
    .using("gist")
    .column("geometry")
    .execute()

  await db.schema
    .createIndex("location_point_gist")
    .on("location")
    .using("gist")
    .column("point")
    .execute()

  await db.schema
    .createIndex("location_suburb_index")
    .on("location")
    .column("suburb")
    .execute()

  await db.schema
    .createIndex("location_city_index")
    .on("location")
    .column("city")
    .execute()

  await db.schema
    .createIndex("location_town_index")
    .on("location")
    .column("town")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex("location_town_index").ifExists().execute()
  await db.schema.dropIndex("location_city_index").ifExists().execute()
  await db.schema.dropIndex("location_suburb_index").ifExists().execute()
  await db.schema.dropIndex("location_point_gist").ifExists().execute()
  await db.schema.dropTable("zone").ifExists().execute()
}

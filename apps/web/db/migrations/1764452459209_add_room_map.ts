// biome-ignore-all lint/suspicious/noExplicitAny: migration files need "any" type for Kysely
import { type Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("room_map")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("room_id", "integer", (col) =>
      col.notNull().unique(),
    )
    .addColumn("position_x", "numeric", (col) =>
      col.notNull(),
    )
    .addColumn("position_y", "numeric", (col) =>
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
    .alterTable("room_map")
    .addForeignKeyConstraint(
      "room_map_room_id_room_id_fk",
      ["room_id"],
      "room",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("room_map").ifExists().execute()
}

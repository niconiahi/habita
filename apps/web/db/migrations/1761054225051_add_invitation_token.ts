import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("invitation_token")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("token", "text")
    .addColumn("email", "text", (col) => col.notNull())
    .addColumn("property_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("expires_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("used_at", "timestamptz")
    .execute()

  await db.schema
    .alterTable("invitation_token")
    .addForeignKeyConstraint(
      "invitation_token_property_id_fkey",
      ["property_id"],
      "property",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("invitation_token")
    .ifExists()
    .execute()
}

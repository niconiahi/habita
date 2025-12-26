import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("contract")
    .addColumn("owner_location_id", "integer", (col) =>
      col.references("location.id"),
    )
    .addColumn("tenant_location_id", "integer", (col) =>
      col.references("location.id"),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("contract")
    .dropColumn("owner_location_id")
    .dropColumn("tenant_location_id")
    .execute()
}

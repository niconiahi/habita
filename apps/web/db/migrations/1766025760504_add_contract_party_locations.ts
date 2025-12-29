import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("contract")
    .addColumn("owner_location_id", "text")
    .addColumn("tenant_location_id", "text")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("contract")
    .dropColumn("owner_location_id")
    .dropColumn("tenant_location_id")
    .execute()
}

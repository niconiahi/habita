import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("property")
    .addColumn("construction_year", "integer")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("property")
    .dropColumn("construction_year")
    .execute()
}

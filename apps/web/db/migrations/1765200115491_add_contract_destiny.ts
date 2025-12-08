import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("contract")
    .addColumn("destiny", "integer")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("contract")
    .dropColumn("destiny")
    .execute()
}

import type { Kysely } from "kysely"
import { sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("property")
    .addColumn("destinies", sql`integer[]`, (col) =>
      col.notNull(),
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable("property")
    .dropColumn("destinies")
    .execute()
}

import type { Kysely } from 'kysely'

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("rate")
		.addColumn("id", "serial", (col) => col.primaryKey().notNull())
		.addColumn("type", "integer", (col) => col.notNull())
		.addColumn("month", "integer", (col) => col.notNull())
		.addColumn("year", "integer", (col) => col.notNull())
		.addColumn("value", "numeric", (col) => col.notNull())
		.addColumn("created_at", "timestamptz", (col) => col.notNull())
		.addColumn("updated_at", "timestamptz", (col) => col.notNull())
		.execute()

	await db.schema
		.alterTable("rate")
		.addUniqueConstraint("rate_type_month_year_unique", [
			"type",
			"month",
			"year",
		])
		.execute()
}

// `any` is required here since migrations should be frozen in time. alternatively, keep a "snapshot" db interface.
export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("rate").ifExists().execute()
}

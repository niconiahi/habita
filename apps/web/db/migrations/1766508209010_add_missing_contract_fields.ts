import type { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("contract")
		.addColumn("cbu", "varchar(22)")
		.addColumn("percentage_return", "integer")
		.addColumn("showroom_hours", "integer")
		.addColumn("court_id", "integer")
		.execute()
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable("contract")
		.dropColumn("cbu")
		.dropColumn("percentage_return")
		.dropColumn("showroom_hours")
		.dropColumn("court_id")
		.execute()
}

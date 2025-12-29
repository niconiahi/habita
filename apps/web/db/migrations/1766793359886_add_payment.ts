// biome-ignore-all lint/suspicious/noExplicitAny: migration files need "any" type for Kysely
import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("payment")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("payment_method_id", "integer", (col) =>
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
    .createTable("payment_mercado_pago")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("preference_id", "text", (col) =>
      col.notNull(),
    )
    .addColumn("operation_id", "text")
    .addColumn("status", "integer", (col) => col.notNull())
    .addColumn("payment_id", "integer", (col) =>
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
    .alterTable("payment_mercado_pago")
    .addForeignKeyConstraint(
      "payment_mercado_pago_payment_id_payment_id_fk",
      ["payment_id"],
      "payment",
      ["id"],
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("payment_mercado_pago")
    .ifExists()
    .execute()
  await db.schema.dropTable("payment").ifExists().execute()
}

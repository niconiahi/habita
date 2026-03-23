// biome-ignore-all lint/suspicious/noExplicitAny: migration files need "any" type for Kysely
import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("subscription")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("organization_id", "text", (col) =>
      col.notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("status", "integer", (col) => col.notNull())
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("starts_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("ends_at", "timestamptz", (col) =>
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
    .alterTable("subscription")
    .addForeignKeyConstraint(
      "subscription_organization_id_organization_id_fk",
      ["organization_id"],
      "organization",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("subscription")
    .addForeignKeyConstraint(
      "subscription_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()

  await db.schema
    .createIndex("idx_subscription_organization_id")
    .on("subscription")
    .column("organization_id")
    .execute()
  await db.schema
    .createIndex("idx_subscription_user_id")
    .on("subscription")
    .column("user_id")
    .execute()

  await db.schema
    .createTable("subscription_payment")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("subscription_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("payment_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .alterTable("subscription_payment")
    .addForeignKeyConstraint(
      "subscription_payment_subscription_id_subscription_id_fk",
      ["subscription_id"],
      "subscription",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("subscription_payment")
    .addForeignKeyConstraint(
      "subscription_payment_payment_id_payment_id_fk",
      ["payment_id"],
      "payment",
      ["id"],
    )
    .execute()

  await db.schema
    .createIndex("idx_subscription_payment_subscription_id")
    .on("subscription_payment")
    .column("subscription_id")
    .execute()
  await db.schema
    .createIndex("idx_subscription_payment_payment_id")
    .on("subscription_payment")
    .column("payment_id")
    .execute()

  await db.schema
    .createTable("job_subscription_payment")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("job_id", "integer", (col) => col.notNull())
    .addColumn(
      "subscription_payment_id",
      "integer",
      (col) => col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .alterTable("job_subscription_payment")
    .addForeignKeyConstraint(
      "job_subscription_payment_job_id_job_id_fk",
      ["job_id"],
      "job",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("job_subscription_payment")
    .addForeignKeyConstraint(
      "job_subscription_payment_sp_id_sp_id_fk",
      ["subscription_payment_id"],
      "subscription_payment",
      ["id"],
    )
    .execute()

  await db.schema
    .createIndex("idx_job_subscription_payment_job_id")
    .on("job_subscription_payment")
    .column("job_id")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("job_subscription_payment")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("subscription_payment")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("subscription")
    .ifExists()
    .execute()
}

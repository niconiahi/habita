import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("job")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("status", "integer", (col) => col.notNull())
    .addColumn("scheduled_at", "timestamptz", (col) =>
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
    .createTable("failed_job")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("job_id", "integer", (col) => col.notNull())
    .addColumn("attempt_count", "integer", (col) =>
      col.notNull().defaultTo(0),
    )
    .addColumn("failed_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .alterTable("failed_job")
    .addForeignKeyConstraint(
      "failed_job_job_id_job_id_fk",
      ["job_id"],
      "job",
      ["id"],
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("failed_job")
    .ifExists()
    .execute()
  await db.schema.dropTable("job").ifExists().execute()
}

// biome-ignore-all lint/suspicious/noExplicitAny: migration files need "any" type for Kysely
import { type Kysely, sql } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await sql`CREATE EXTENSION IF NOT EXISTS postgis`.execute(
    db,
  )

  await db.schema
    .createTable("user")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("email", "text", (col) =>
      col.notNull().unique(),
    )
    .addColumn("name", "text")
    .addColumn("surname", "text")
    .addColumn("phone_number", "varchar(16)")
    .addColumn("document_number", "integer")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("session")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("expires_at", "timestamptz", (col) =>
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
    .createTable("access")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("property_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("contract")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("property_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("state", "integer", (col) => col.notNull())
    .addColumn("type", "integer")
    .addColumn("formula", "text")
    .addColumn("duration", "text") // ISO-8601 duration format
    .addColumn("start_date", "timestamptz")
    .addColumn("end_date", "timestamptz")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("formula_parameter")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("period_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("key", "text", (col) => col.notNull())
    .addColumn("value", "numeric", (col) => col.notNull())
    .addColumn("start_date", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("end_date", "timestamptz", (col) =>
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
    .createTable("location")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("address", "text", (col) => col.notNull())
    .addColumn("latitude", "decimal", (col) =>
      col.notNull(),
    )
    .addColumn("longitude", "decimal", (col) =>
      col.notNull(),
    )
    .addColumn("point", sql`geometry(point)`, (col) =>
      col.notNull(),
    )
    .addColumn("road", "text", (col) => col.notNull())
    .addColumn("house_number", "numeric", (col) =>
      col.notNull(),
    )
    .addColumn("suburb", "text")
    .addColumn("city", "text")
    .addColumn("town", "text")
    .addColumn("state", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("period")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("contract_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("price", "numeric", (col) => col.notNull())
    .addColumn("start_date", "timestamptz")
    .addColumn("end_date", "timestamptz")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("property")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("state", "integer", (col) => col.notNull())
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("location_id", "integer", (col) =>
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
    .createTable("property_type_department")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("unit", "text", (col) => col.notNull())
    .addColumn("floor", "integer", (col) => col.notNull())
    .addColumn("property_id", "integer", (col) =>
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
    .createTable("service")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("property_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("code", "varchar", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("room")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("property_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("width", "numeric", (col) => col.notNull())
    .addColumn("length", "numeric", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .alterTable("access")
    .addForeignKeyConstraint(
      "access_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("access")
    .addForeignKeyConstraint(
      "access_property_id_property_id_fk",
      ["property_id"],
      "property",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("contract")
    .addForeignKeyConstraint(
      "contract_property_id_property_id_fk",
      ["property_id"],
      "property",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("formula_parameter")
    .addForeignKeyConstraint(
      "formula_parameter_period_id_period_id_fk",
      ["period_id"],
      "period",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("period")
    .addForeignKeyConstraint(
      "period_contract_id_contract_id_fk",
      ["contract_id"],
      "contract",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("property")
    .addForeignKeyConstraint(
      "property_location_id_location_id_fk",
      ["location_id"],
      "location",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("room")
    .addForeignKeyConstraint(
      "room_property_id_property_id_fk",
      ["property_id"],
      "property",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("service")
    .addForeignKeyConstraint(
      "service_property_id_property_id_fk",
      ["property_id"],
      "property",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("session")
    .addForeignKeyConstraint(
      "session_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("service")
    .addUniqueConstraint(
      "service_property_id_type_unique",
      ["property_id", "type"],
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("formula_parameter")
    .ifExists()
    .execute()
  await db.schema.dropTable("access").ifExists().execute()
  await db.schema.dropTable("session").ifExists().execute()
  await db.schema.dropTable("service").ifExists().execute()
  await db.schema.dropTable("room").ifExists().execute()
  await db.schema.dropTable("period").ifExists().execute()
  await db.schema.dropTable("contract").ifExists().execute()
  await db.schema.dropTable("property").ifExists().execute()
  await db.schema.dropTable("location").ifExists().execute()
  await db.schema.dropTable("user").ifExists().execute()
}

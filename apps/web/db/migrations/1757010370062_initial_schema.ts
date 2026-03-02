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
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("surname", "text", (col) => col.notNull())
    .addColumn("phone_number", "text")
    .addColumn("document_number", "text")
    .addColumn("cuil", "text")
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
    .createTable("property_access")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("property_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("granted_by", "integer")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()
  await db.schema
    .createIndex(
      "property_access_property_user_type_unique",
    )
    .on("property_access")
    .columns(["property_id", "user_id", "type"])
    .unique()
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
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("escalation_type", "integer")
    .addColumn("escalation_duration", "text")
    .addColumn("fine_type", "integer")
    .addColumn("fine_amount", "numeric")
    .addColumn("default_type", "integer")
    .addColumn("default_amount", "numeric")
    .addColumn("default_duration", "text")
    .addColumn("early_termination", "integer")
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
    .addColumn("house_number", "integer", (col) =>
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
    .addColumn("price", "integer", (col) => col.notNull())
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
    .addColumn("unit", "text")
    .addColumn("location_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("realtor_id", "text")
    .addColumn("team_id", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("realtor")
    .addColumn("id", "text", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("realtor_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
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
    .alterTable("property_access")
    .addForeignKeyConstraint(
      "property_access_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("property_access")
    .addForeignKeyConstraint(
      "property_access_property_id_property_id_fk",
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
    .alterTable("property_access")
    .addForeignKeyConstraint(
      "property_access_granted_by_user_id_fk",
      ["granted_by"],
      "user",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("realtor")
    .addForeignKeyConstraint(
      "realtor_realtor_id_user_id_fk",
      ["realtor_id"],
      "user",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("realtor")
    .addForeignKeyConstraint(
      "realtor_user_id_user_id_fk",
      ["user_id"],
      "user",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("realtor")
    .addUniqueConstraint(
      "realtor_realtor_id_user_id_unique",
      ["realtor_id", "user_id"],
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
  await db.schema
    .createIndex("idx_session_user_id")
    .on("session")
    .column("user_id")
    .execute()
  await db.schema
    .createIndex("idx_property_access_user_id")
    .on("property_access")
    .column("user_id")
    .execute()
  await db.schema
    .createIndex("idx_property_access_granted_by")
    .on("property_access")
    .column("granted_by")
    .execute()
  await db.schema
    .createIndex("idx_contract_property_id")
    .on("contract")
    .column("property_id")
    .execute()
  await db.schema
    .createIndex("idx_formula_parameter_period_id")
    .on("formula_parameter")
    .column("period_id")
    .execute()
  await db.schema
    .createIndex("idx_period_contract_id")
    .on("period")
    .column("contract_id")
    .execute()
  await db.schema
    .createIndex("idx_property_location_id")
    .on("property")
    .column("location_id")
    .execute()
  await db.schema
    .createIndex("idx_realtor_user_id")
    .on("realtor")
    .column("user_id")
    .execute()
  await db.schema
    .createIndex("idx_room_property_id")
    .on("room")
    .column("property_id")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("formula_parameter")
    .ifExists()
    .execute()
  await db.schema.dropTable("realtor").ifExists().execute()
  await db.schema
    .dropTable("property_access")
    .ifExists()
    .execute()
  await db.schema.dropTable("session").ifExists().execute()
  await db.schema.dropTable("service").ifExists().execute()
  await db.schema.dropTable("room").ifExists().execute()
  await db.schema.dropTable("period").ifExists().execute()
  await db.schema.dropTable("contract").ifExists().execute()
  await db.schema.dropTable("property").ifExists().execute()
  await db.schema.dropTable("location").ifExists().execute()
  await db.schema.dropTable("user").ifExists().execute()
}

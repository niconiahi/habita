import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  // Create warranty table (discriminator)
  await db.schema
    .createTable("warranty")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()
  // Create property_warranty table
  await db.schema
    .createTable("property_warranty")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("warranty_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("guarantor_name", "text", (col) =>
      col.notNull(),
    )
    .addColumn("guarantor_dni", "text", (col) =>
      col.notNull(),
    )
    .addColumn("guarantor_email", "text", (col) =>
      col.notNull(),
    )
    .addColumn("location_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("cadastral_district", "text", (col) =>
      col.notNull(),
    )
    .addColumn("cadastral_section", "text", (col) =>
      col.notNull(),
    )
    .addColumn("cadastral_block", "text", (col) =>
      col.notNull(),
    )
    .addColumn("cadastral_parcel", "text", (col) =>
      col.notNull(),
    )
    .addColumn("property_tax_id", "text", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()
  // Create income_warranty table
  await db.schema
    .createTable("income_warranty")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("warranty_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()
  // Create income_warranty_guarantor table
  await db.schema
    .createTable("income_warranty_guarantor")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("income_warranty_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("guarantor_name", "text", (col) =>
      col.notNull(),
    )
    .addColumn("guarantor_dni", "text", (col) =>
      col.notNull(),
    )
    .addColumn("guarantor_email", "text", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()
  // Create surety_warranty table
  await db.schema
    .createTable("surety_warranty")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("warranty_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("guarantor_name", "text", (col) =>
      col.notNull(),
    )
    .addColumn("guarantor_dni", "text", (col) =>
      col.notNull(),
    )
    .addColumn("guarantor_email", "text", (col) =>
      col.notNull(),
    )
    .addColumn("company_name", "text", (col) =>
      col.notNull(),
    )
    .addColumn("policy_number", "text", (col) =>
      col.notNull(),
    )
    .addColumn("company_email", "text", (col) =>
      col.notNull(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()
  // Add warranty_id to contract table
  await db.schema
    .alterTable("contract")
    .addColumn("warranty_id", "integer")
    .execute()
  // Add foreign key constraints
  await db.schema
    .alterTable("property_warranty")
    .addForeignKeyConstraint(
      "property_warranty_warranty_id_warranty_id_fk",
      ["warranty_id"],
      "warranty",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("property_warranty")
    .addForeignKeyConstraint(
      "property_warranty_location_id_location_id_fk",
      ["location_id"],
      "location",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("income_warranty")
    .addForeignKeyConstraint(
      "income_warranty_warranty_id_warranty_id_fk",
      ["warranty_id"],
      "warranty",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("income_warranty_guarantor")
    .addForeignKeyConstraint(
      "income_warranty_guarantor_income_warranty_id_income_warranty_id_fk",
      ["income_warranty_id"],
      "income_warranty",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()
  await db.schema
    .alterTable("surety_warranty")
    .addForeignKeyConstraint(
      "surety_warranty_warranty_id_warranty_id_fk",
      ["warranty_id"],
      "warranty",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("contract")
    .addForeignKeyConstraint(
      "contract_warranty_id_warranty_id_fk",
      ["warranty_id"],
      "warranty",
      ["id"],
    )
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Remove FK from contract first
  await db.schema
    .alterTable("contract")
    .dropConstraint("contract_warranty_id_warranty_id_fk")
    .execute()
  await db.schema
    .alterTable("contract")
    .dropColumn("warranty_id")
    .execute()
  // Drop tables in reverse dependency order
  await db.schema
    .dropTable("income_warranty_guarantor")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("surety_warranty")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("income_warranty")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("property_warranty")
    .ifExists()
    .execute()
  await db.schema.dropTable("warranty").ifExists().execute()
}

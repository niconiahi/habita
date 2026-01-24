import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  // Add organization_id column to property table
  await db.schema
    .alterTable("property")
    .addColumn("organization_id", "text")
    .execute()

  // Add foreign key constraint
  await db.schema
    .alterTable("property")
    .addForeignKeyConstraint(
      "property_organization_id_organization_id_fk",
      ["organization_id"],
      "organization",
      ["id"],
    )
    .execute()

  // Drop foreign key constraints from property_organization
  await db.schema
    .alterTable("property_organization")
    .dropConstraint("property_organization_property_id_property_id_fk")
    .execute()
  await db.schema
    .alterTable("property_organization")
    .dropConstraint(
      "property_organization_organization_id_organization_id_fk",
    )
    .execute()

  // Drop property_organization table
  await db.schema.dropTable("property_organization").execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  // Recreate property_organization table
  await db.schema
    .createTable("property_organization")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("property_id", "integer", (col) =>
      col.notNull().unique(),
    )
    .addColumn("organization_id", "text", (col) =>
      col.notNull(),
    )
    .addColumn("assigned_admin_id", "integer", (col) =>
      col.references("user.id").onDelete("set null"),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  // Add foreign key constraints back
  await db.schema
    .alterTable("property_organization")
    .addForeignKeyConstraint(
      "property_organization_property_id_property_id_fk",
      ["property_id"],
      "property",
      ["id"],
    )
    .execute()
  await db.schema
    .alterTable("property_organization")
    .addForeignKeyConstraint(
      "property_organization_organization_id_organization_id_fk",
      ["organization_id"],
      "organization",
      ["id"],
    )
    .execute()

  // Drop organization_id from property
  await db.schema
    .alterTable("property")
    .dropConstraint("property_organization_id_organization_id_fk")
    .execute()
  await db.schema
    .alterTable("property")
    .dropColumn("organization_id")
    .execute()
}

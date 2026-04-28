import type { Kysely } from "kysely"

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("file")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("basename", "text", (col) => col.notNull())
    .addColumn("mime", "text", (col) => col.notNull())
    .addColumn("size", "bigint", (col) => col.notNull())
    .addColumn("hash", "text", (col) =>
      col.notNull().unique(),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("user_file")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("user_id", "integer", (col) => col.notNull())
    .addColumn("file_id", "integer", (col) => col.notNull())
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("contract_file")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("contract_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("file_id", "integer", (col) => col.notNull())
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("property_file")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("property_id", "integer", (col) =>
      col.notNull(),
    )
    .addColumn("file_id", "integer", (col) => col.notNull())
    .addColumn("type", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .createTable("room_file")
    .addColumn("id", "serial", (col) =>
      col.primaryKey().notNull(),
    )
    .addColumn("room_id", "integer", (col) => col.notNull())
    .addColumn("file_id", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull(),
    )
    .execute()

  await db.schema
    .alterTable("contract_file")
    .addForeignKeyConstraint(
      "contract_file_contract_id_contract_id_fk",
      ["contract_id"],
      "contract",
      ["id"],
    )
    .execute()

  await db.schema
    .alterTable("contract_file")
    .addForeignKeyConstraint(
      "contract_file_file_id_file_id_fk",
      ["file_id"],
      "file",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()

  // await db.schema
  //   .alterTable("contract_file")
  //   .addForeignKeyConstraint(
  //     "contract_file_user_id_user_id_fk",
  //     ["user_id"],
  //     "user",
  //     ["id"],
  //   )
  //   .execute()
  await db.schema
    .createIndex("idx_user_file_user_id")
    .on("user_file")
    .column("user_id")
    .execute()
  await db.schema
    .createIndex("idx_user_file_file_id")
    .on("user_file")
    .column("file_id")
    .execute()
  await db.schema
    .createIndex("idx_contract_file_contract_id")
    .on("contract_file")
    .column("contract_id")
    .execute()
  await db.schema
    .createIndex("idx_contract_file_file_id")
    .on("contract_file")
    .column("file_id")
    .execute()
  await db.schema
    .createIndex("idx_property_file_property_id")
    .on("property_file")
    .column("property_id")
    .execute()
  await db.schema
    .createIndex("idx_property_file_file_id")
    .on("property_file")
    .column("file_id")
    .execute()
  await db.schema
    .alterTable("room_file")
    .addForeignKeyConstraint(
      "room_file_room_id_room_id_fk",
      ["room_id"],
      "room",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()
  await db.schema
    .alterTable("room_file")
    .addForeignKeyConstraint(
      "room_file_file_id_file_id_fk",
      ["file_id"],
      "file",
      ["id"],
      (cb) => cb.onDelete("cascade"),
    )
    .execute()
  await db.schema
    .createIndex("idx_room_file_room_id")
    .on("room_file")
    .column("room_id")
    .execute()
  await db.schema
    .createIndex("idx_room_file_file_id")
    .on("room_file")
    .column("file_id")
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .dropTable("room_file")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("contract_file")
    .ifExists()
    .execute()
  await db.schema
    .dropTable("user_file")
    .ifExists()
    .execute()
  await db.schema.dropTable("file").ifExists().execute()
}

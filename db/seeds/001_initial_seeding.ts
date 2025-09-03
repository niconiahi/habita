import { hash } from "@node-rs/argon2"
import { sql } from "kysely"
import { query_builder } from "../query_builder"

async function hash_password(
  password: string,
): Promise<string> {
  return hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  })
}

enum RoomType {
  BEDROOM = 0,
  BATHROOM = 1,
  KITCHEN = 2,
  LIVING_ROOM = 3,
  DINING_ROOM = 4,
}

enum ContractType {
  SHORT_TERM = 0,
  LONG_TERM = 1,
}

enum AccessRole {
  OWNER = 0,
  ADMINISTRATOR = 1,
  TENANT = 2,
}

async function upsert_user(
  username: string,
  password: string,
  now: Date,
) {
  const existing_user = await query_builder
    .selectFrom("user")
    .select("id")
    .where("username", "=", username)
    .executeTakeFirst()
  if (existing_user) {
    console.log(`user ${username} already exists, skipping`)
    return existing_user.id
  }
  const user = await query_builder
    .insertInto("user")
    .values({
      username,
      password_hash: await hash_password(password),
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created user with id ${user.id}`)
  return user.id
}

async function run() {
  console.log("seeding")
  const now = new Date()

  console.log("creating users")
  const owner_id = await upsert_user(
    "niconiahi",
    "owner",
    now,
  )
  const admin_id = await upsert_user(
    "admin@inmobi.rent",
    "admin",
    now,
  )
  const tenant_id = await upsert_user(
    "tenant@inmobi.rent",
    "tenant",
    now,
  )

  const location = await query_builder
    .insertInto("location")
    .values({
      address:
        "1180, Padilla, Villa Crespo, Buenos Aires, Distrito Audiovisual, Comuna 15, Autonomous City of Buenos Aires, C1414CXE, Argentina",
      // point: { x: -58.4498605, y: -34.5959112 },
      point: sql`ST_GeomFromText('POINT(-58.4498605 -34.5959112)', 4326)`,
      road: "Padilla",
      house_number: "1180",
      suburb: "Recoleta",
      city: "Buenos Aires",
      city_district: "Buenos Aires",
      postcode: "C1429",
      country: "Argentina",
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created location", location.id)

  const property = await query_builder
    .insertInto("property")
    .values({
      location_id: location.id,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created property", property.id)

  const rooms = [
    { type: RoomType.BEDROOM, width: "4.5", length: "3.2" },
    {
      type: RoomType.BATHROOM,
      width: "2.1",
      length: "1.8",
    },
    { type: RoomType.KITCHEN, width: "3.5", length: "2.8" },
  ]

  for (const room_ of rooms) {
    const room = await query_builder
      .insertInto("room")
      .values({
        property_id: property.id,
        type: room_.type,
        width: room_.width,
        length: room_.length,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    console.log("created room", room.id)
  }

  const contract_start_date = new Date(
    now.getFullYear() - 1,
    now.getDate(),
  )
  const contract_end_date = new Date(
    contract_start_date.getFullYear() + 1,
    contract_start_date.getMonth(),
    contract_start_date.getDate(),
  )
  const contract = await query_builder
    .insertInto("contract")
    .values({
      property_id: property.id,
      type: ContractType.LONG_TERM,
      frequency: "3_months",
      formula:
        "price * (ipc_current_month / ipc_four_months_ago)",
      start_date: contract_start_date,
      end_date: contract_end_date,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created contract", contract.id)

  const price = 600000
  const period_end_date = new Date(
    contract_start_date.getFullYear(),
    contract_start_date.getMonth() + 3,
    contract_start_date.getDate(),
  )
  const period = await query_builder
    .insertInto("period")
    .values({
      contract_id: contract.id,
      price: price.toString(),
      start_date: contract_start_date,
      end_date: period_end_date,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created period", period.id)

  const accesses = [
    { user_id: owner_id, role: AccessRole.OWNER },
    { user_id: admin_id, role: AccessRole.ADMINISTRATOR },
    { user_id: tenant_id, role: AccessRole.TENANT },
  ]
  for (const access_ of accesses) {
    const access = await query_builder
      .insertInto("access")
      .values({
        user_id: access_.user_id,
        property_id: property.id,
        role: access_.role.toString(),
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    console.log("created access", access.id)
  }
}

run()
  .then(() => {
    console.log("seed completed")
    process.exit(0)
  })
  .catch((error) => {
    console.error("error", error)
    process.exit(1)
  })

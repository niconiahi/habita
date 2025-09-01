import { hash } from "@node-rs/argon2"
import { encodeBase32LowerCase } from "@oslojs/encoding"
import { sql } from "kysely"
import { query_builder } from "../query_builder"

function generate_id(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(15))
  return encodeBase32LowerCase(bytes)
}

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

async function upsertUser(
  username: string,
  password: string,
  now: Date,
) {
  const existingUser = await query_builder
    .selectFrom("user")
    .select("id")
    .where("username", "=", username)
    .executeTakeFirst()

  if (existingUser) {
    console.log(`User ${username} already exists, skipping`)
    return existingUser.id
  }

  const user_id = generate_id()
  await query_builder
    .insertInto("user")
    .values({
      id: user_id,
      username,
      password_hash: await hash_password(password),
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(`Created user ${username}`)
  return user_id
}

async function run() {
  console.log("seeding")
  const now = new Date()

  console.log("creating users")
  const owner_id = await upsertUser(
    "niconiahi",
    "owner",
    now,
  )
  const admin_id = await upsertUser(
    "admin@inmobi.rent",
    "admin",
    now,
  )
  const tenant_id = await upsertUser(
    "tenant@inmobi.rent",
    "tenant",
    now,
  )

  const location_id = generate_id()
  const [location] = await query_builder
    .insertInto("location")
    .values({
      id: location_id,
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
    .execute()
  console.log("created location", location.insertId)

  const property_id = generate_id()
  const [property] = await query_builder
    .insertInto("property")
    .values({
      id: property_id,
      location_id: location_id,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log("created property:", property.insertId)

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
    const roomId = generate_id()
    const [room] = await query_builder
      .insertInto("room")
      .values({
        id: roomId,
        property_id: property_id,
        type: room_.type.toString(),
        width: room_.width,
        length: room_.length,
        created_at: now,
        updated_at: now,
      })
      .execute()
    console.log("created room", room.insertId)
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
  const contract_id = generate_id()
  const [contract] = await query_builder
    .insertInto("contract")
    .values({
      id: contract_id,
      property_id: property_id,
      type: ContractType.LONG_TERM.toString(),
      frequency: "3_months",
      formula:
        "price * (ipc_current_month / ipc_four_months_ago)",
      start_date: contract_start_date,
      end_date: contract_end_date,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log("created contract:", contract.insertId)

  const price = 600000
  const period_end_date = new Date(
    contract_start_date.getFullYear(),
    contract_start_date.getMonth() + 3,
    contract_start_date.getDate(),
  )
  const period_id = generate_id()
  const [period] = await query_builder
    .insertInto("period")
    .values({
      id: period_id,
      contract_id: contract_id,
      price: price.toString(),
      start_date: contract_start_date,
      end_date: period_end_date,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log("created period:", period.insertId)

  const accesses = [
    { user_id: owner_id, role: AccessRole.OWNER },
    { user_id: admin_id, role: AccessRole.ADMINISTRATOR },
    { user_id: tenant_id, role: AccessRole.TENANT },
  ]
  for (const access_ of accesses) {
    const accessId = generate_id()
    const [access] = await query_builder
      .insertInto("access")
      .values({
        id: accessId,
        user_id: access_.user_id,
        property_id: property_id,
        role: access_.role.toString(),
        created_at: now,
        updated_at: now,
      })
      .execute()
    console.log("created access", access.insertId)
  }

  console.log("seed completed")
}

run()
  .then(() => {
    console.log("Seed completed successfully")
    process.exit(0)
  })
  .catch((error) => {
    console.error("Seed failed:", error)
    process.exit(1)
  })

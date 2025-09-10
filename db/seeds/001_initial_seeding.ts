import * as v from "valibot"
import { AccessRole } from "../../app/lib/server/access_role.ts"
import { ContractFileType } from "../../app/lib/server/contract_file_type.ts"
import { ContractState } from "../../app/lib/server/contract_state.ts"
import { ContractType } from "../../app/lib/server/contract_type.ts"
import { compose_point } from "../../app/lib/server/point.ts"
import { ROOM_TYPE } from "../../app/lib/room_type.ts"
import { query_builder } from "../query_builder"

async function upsert_file(path: string) {
  const file = Bun.file(path)
  const content = Buffer.from(await file.arrayBuffer())
  const now = new Date()
  const hash = Bun.CryptoHasher.hash(
    "sha256",
    content,
    "hex",
  )
  const basename = v.parse(
    v.string("basename is required"),
    path.split("/").pop(),
  )
  const mime = v.parse(
    v.string("mime is required"),
    file.type,
  )
  const existing_file = await query_builder
    .selectFrom("file")
    .select("id")
    .where("hash", "=", hash)
    .executeTakeFirst()
  let file_id: number
  if (existing_file) {
    console.log(
      `file with hash ${hash} already exists, reusing`,
    )
    file_id = existing_file.id
  } else {
    const file = await query_builder
      .insertInto("file")
      .values({
        mime,
        basename,
        content,
        size: content.length,
        hash: hash,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    file_id = file.id
    console.log(`created file with id ${file_id}`)
  }
  return file_id
}

async function upsert_user(email: string, now: string) {
  const existing_user = await query_builder
    .selectFrom("user")
    .select("id")
    .where("email", "=", email)
    .executeTakeFirst()
  if (existing_user) {
    console.log(`user ${email} already exists, skipping`)
    return existing_user.id
  }
  const user = await query_builder
    .insertInto("user")
    .values({
      email,
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
  const now = new Date().toISOString()
  console.log("creating users")
  const owner_id = await upsert_user(
    "owner@inmobi.rent",
    now,
  )
  const admin_id = await upsert_user(
    "nicolas.accetta@gmail.com",
    now,
  )
  const tenant_id = await upsert_user(
    "tenant@inmobi.rent",
    now,
  )

  const latitude = -58.4498605
  const longitude = -34.5959112
  const location = await query_builder
    .insertInto("location")
    .values({
      address:
        "1180, Padilla, Villa Crespo, Buenos Aires, Distrito Audiovisual, Comuna 15, Autonomous City of Buenos Aires, C1414CXE, Argentina",
      latitude,
      longitude,
      point: compose_point(latitude, longitude),
      road: "Padilla",
      house_number: "1180",
      suburb: "Villa Crespo",
      state: "Buenos Aires",
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created location", location.id)

  const property = await query_builder
    .insertInto("property")
    .values({
      user_id: owner_id,
      location_id: location.id,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created property", property.id)

  const rooms = [
    {
      type: ROOM_TYPE.BEDROOM,
      width: "4.5",
      length: "3.2",
    },
    {
      type: ROOM_TYPE.BATHROOM,
      width: "2.1",
      length: "1.8",
    },
    {
      type: ROOM_TYPE.KITCHEN,
      width: "3.5",
      length: "2.8",
    },
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

  const date = new Date()
  const contract_start_date = new Date(date)
  contract_start_date.setFullYear(date.getFullYear() - 1)
  const contract_end_date = new Date(date)
  contract_end_date.setFullYear(date.getFullYear())
  const contract = await query_builder
    .insertInto("contract")
    .values({
      property_id: property.id,
      type: ContractType.LONG_TERM,
      state: ContractState.FINISHED,
      duration: "P3M",
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

  const file_id = await upsert_file(
    `${import.meta.dir}/../files/invoice-march.pdf`,
  )
  await query_builder
    .insertInto("contract_file")
    .values({
      file_id,
      user_id: admin_id,
      contract_id: contract.id,
      created_at: now,
      updated_at: now,
      type: ContractFileType.Contract,
    })
    .execute()

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

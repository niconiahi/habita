import * as v from "valibot"
import {
  ROOM_TYPE,
  type RoomType,
} from "../../app/lib/room_type.ts"
import {
  ACCESS_TYPE,
  type AccessType,
} from "../../app/lib/server/access_type.ts"
import {
  CONTRACT_FILE_TYPE,
  type ContractFileType,
} from "../../app/lib/server/contract_file_type.ts"
import { CONTRACT_STATE } from "../../app/lib/server/contract_state.ts"
import { ContractType } from "../../app/lib/server/contract_type.ts"
import { compose_point } from "../../app/lib/server/point.ts"
import {
  SERVICE_TYPE,
  type ServiceType,
} from "../../app/lib/service.ts"
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
    "nicolas.accetta@gmail.com",
    now,
  )
  const admin_id = await upsert_user(
    "admin@inmobi.rent",
    now,
  )
  const tenant_id = await upsert_user(
    "tenant@inmobi.rent",
    now,
  )

  const latitude = -34.595834
  const longitude = -58.447219
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

  const rooms: {
    type: RoomType
    width: string
    length: string
  }[] = [
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
      state: CONTRACT_STATE.FINISHED,
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

  const services: {
    type: ServiceType
    code: string
  }[] = [
    {
      type: SERVICE_TYPE.MUNICIPAL_FEE,
      code: "0070039841684",
    },
    {
      type: SERVICE_TYPE.LIGHT,
      code: "004660340",
    },
    {
      type: SERVICE_TYPE.GAS,
      code: "030010294440",
    },
  ]
  for (const service of services) {
    await query_builder
      .insertInto("service")
      .values({
        code: service.code,
        property_id: property.id,
        created_at: now,
        updated_at: now,
        type: service.type,
      })
      .execute()
    console.log("created service")
  }

  function compose_file_path(basename: string) {
    return `${import.meta.dir}/../files/${basename}`
  }
  const CONTRACT_FILES: {
    type: ContractFileType
    path: string
  }[] = [
    {
      type: CONTRACT_FILE_TYPE.CONTRACT,
      path: compose_file_path("contract.pdf"),
    },
    {
      type: CONTRACT_FILE_TYPE.INSURANCE,
      path: compose_file_path("insurance.pdf"),
    },
  ]
  for (const contract_file of CONTRACT_FILES) {
    const file_id = await upsert_file(contract_file.path)
    await query_builder
      .insertInto("contract_file")
      .values({
        file_id,
        user_id: admin_id,
        contract_id: contract.id,
        created_at: now,
        updated_at: now,
        type: contract_file.type,
      })
      .execute()
    console.log("created contract file")
  }

  const accesses: {
    user_id: number
    type: AccessType
  }[] = [
    { user_id: owner_id, type: ACCESS_TYPE.OWNER },
    {
      user_id: admin_id,
      type: ACCESS_TYPE.ADMINISTRATOR,
    },
    { user_id: tenant_id, type: ACCESS_TYPE.TENANT },
  ]
  for (const access_ of accesses) {
    const access = await query_builder
      .insertInto("access")
      .values({
        user_id: access_.user_id,
        property_id: property.id,
        type: access_.type,
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

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
import { PROPERTY_FILE_TYPE } from "../../app/lib/server/property_file_type.ts"
import { CONTRACT_STATE } from "../../app/lib/server/contract_state.ts"
import { PROPERTY_STATE } from "../../app/lib/server/property_state.ts"
import { PROPERTY_TYPE } from "../../app/lib/server/property_type.ts"
import { get_month, get_year } from "../../app/lib/date.ts"
import { SLOT_STATE } from "../../app/lib/server/slot_state.ts"
import { ContractType } from "../../app/lib/server/contract_type.ts"
import { compose_point } from "../../app/lib/server/point.ts"
import {
  SERVICE_TYPE,
  type ServiceType,
} from "../../app/lib/service.ts"
import {
  RATE_TYPE,
  RateType,
} from "../../app/lib/server/rate_type.ts"
import { query_builder } from "../query_builder"
import {
  subMonths,
  addMonths,
  addDays,
  subDays,
} from "date-fns"

function compose_file_path(basename: string) {
  return `${import.meta.dir}/../files/${basename}`
}

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

async function upsert_user({
  name,
  surname,
  email,
  now,
  document_number,
  phone_number,
}: {
  name: string
  surname: string
  email: string
  now: string
  document_number: number
  phone_number: string
}) {
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
      name,
      surname,
      phone_number,
      document_number,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created user with id ${user.id}`)
  return user.id
}

async function make_finished_contract(
  property_id: number,
  now: string,
) {
  const date = new Date()
  const contract_start_date = subMonths(date, 12)
  const contract_end_date = date
  const contract = await query_builder
    .insertInto("contract")
    .values({
      property_id,
      type: ContractType.LONG_TERM,
      state: CONTRACT_STATE.FINISHED,
      start_date: contract_start_date,
      end_date: contract_end_date,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created contract", contract.id)

  const price = 600000
  const period_end_date = addMonths(contract_start_date, 3)
  const period = await query_builder
    .insertInto("period")
    .values({
      contract_id: contract.id,
      price,
      start_date: contract_start_date,
      end_date: period_end_date,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created period", period.id)
  return contract
}

async function make_editing_contract(
  property_id: number,
  now: string,
  admin_id: number,
) {
  const date = new Date()
  const contract_start_date = addMonths(date, 3)
  const contract_end_date = addMonths(
    contract_start_date,
    12,
  )
  const contract = await query_builder
    .insertInto("contract")
    .values({
      property_id,
      type: ContractType.LONG_TERM,
      state: CONTRACT_STATE.EDITING,
      start_date: contract_start_date,
      end_date: contract_end_date,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created contract", contract.id)

  const price = 800000
  const period_end_date = addMonths(contract_start_date, 3)
  const period = await query_builder
    .insertInto("period")
    .values({
      contract_id: contract.id,
      price,
      start_date: contract_start_date,
      end_date: period_end_date,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  const SLOTS: {
    start_date: Date
    end_date: Date
  }[] = [
    {
      start_date: new Date(2024, 9, 25, 15, 15),
      end_date: new Date(2024, 9, 25, 15, 45),
    },
    {
      start_date: new Date(2024, 9, 25, 15, 45),
      end_date: new Date(2024, 9, 25, 16, 15),
    },
    {
      start_date: new Date(2024, 9, 25, 16, 15),
      end_date: new Date(2024, 9, 25, 16, 45),
    },
  ]
  for (const slot_ of SLOTS) {
    const slot = await query_builder
      .insertInto("slot")
      .values({
        property_id,
        event_id:
          "NHN2NmxmN3Y1dmt0cjFzNWF2NmprbWw0OTAgbmljb2xhcy5hY2NldHRhQG0",
        host_id: admin_id,
        state: SLOT_STATE.FREE,
        start_date: slot_.start_date,
        end_date: slot_.end_date,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    console.log("slot created", slot.id)
  }
  console.log("created period", period.id)
  return contract
}

async function run() {
  console.log("seeding")
  const now = new Date().toISOString()
  console.log("creating users")
  const owner_id = await upsert_user({
    surname: "Andrea",
    name: "Medina",
    phone_number: "+5491125597648",
    document_number: 36829114,
    now,
    email: "medina93andrea@gmail.com",
  })
  const admin_id = await upsert_user({
    surname: "Accetta",
    name: "Nicolas",
    phone_number: "+5491122537752",
    document_number: 37782650,
    now,
    email: "nicolas.accetta@gmail.com",
  })
  const tenant_id = await upsert_user({
    surname: "Mario",
    name: "Luis",
    phone_number: "+5491188310588",
    document_number: 30019119,
    now,
    email: "mario.luis@gmail.com",
  })
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
      house_number: 1180,
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
      state: PROPERTY_STATE.PUBLISHED,
      type: PROPERTY_TYPE.DEPARTMENT,
      unit: "10C",
      location_id: location.id,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()

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

  const finished_contract = await make_finished_contract(
    property.id,
    now,
  )
  const editing_contract = await make_editing_contract(
    property.id,
    now,
    admin_id,
  )
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
        contract_id: finished_contract.id,
        created_at: now,
        updated_at: now,
        type: contract_file.type,
      })
      .execute()
    await query_builder
      .insertInto("contract_file")
      .values({
        file_id,
        contract_id: editing_contract.id,
        created_at: now,
        updated_at: now,
        type: contract_file.type,
      })
      .execute()
    console.log("created contract file")
  }
  const PROPERTY_FILES: {
    type: ContractFileType
    path: string
  }[] = [
    {
      type: PROPERTY_FILE_TYPE.PHOTO,
      path: compose_file_path("property_image_1.webp"),
    },
    {
      type: PROPERTY_FILE_TYPE.PHOTO,
      path: compose_file_path("property_image_2.webp"),
    },
  ]
  for (const property_file of PROPERTY_FILES) {
    const file_id = await upsert_file(property_file.path)
    await query_builder
      .insertInto("property_file")
      .values({
        file_id,
        property_id: property.id,
        created_at: now,
        updated_at: now,
        type: property_file.type,
      })
      .execute()
    console.log("created property file")
  }

  console.log("creating test rate data for escalation")
  const date = new Date()

  const RATES: {
    type: RateType
    month: number
    year: number
    value: string
  }[] = [
    {
      type: RATE_TYPE.IPC,
      month: get_month(date),
      year: get_year(date),
      value: "1.21",
    },
    {
      type: RATE_TYPE.IPC,
      month: get_month(subMonths(date, 3)),
      year: get_year(subMonths(date, 3)),
      value: "1.1",
    },
  ]
  for (const rate of RATES) {
    await query_builder
      .insertInto("rate")
      .values({
        type: rate.type,
        month: rate.month,
        year: rate.year,
        value: rate.value,
        created_at: now,
        updated_at: now,
      })
      .execute()
    console.log("created rate")
  }
  console.log(
    "creating active contract with due escalation",
  )
  const contract = await query_builder
    .insertInto("contract")
    .values({
      property_id: property.id,
      type: ContractType.LONG_TERM,
      state: CONTRACT_STATE.ACTIVE,
      escalation_type: RATE_TYPE.IPC,
      escalation_duration: "P3M",
      start_date: subMonths(date, 6),
      end_date: addMonths(date, 6),
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log("created contract", contract.id)

  const PERIODS: {
    contract_id: number
    price: number
    start_date: Date
    end_date: Date
  }[] = [
    {
      contract_id: contract.id,
      start_date: subMonths(date, 6),
      end_date: subMonths(date, 3),
      price: 600000,
    },
    {
      contract_id: contract.id,
      start_date: addDays(subMonths(date, 3), 1),
      end_date: subDays(date, 1),
      price: 600000,
    },
  ]
  for (const period of PERIODS) {
    await query_builder
      .insertInto("period")
      .values({
        contract_id: period.contract_id,
        price: period.price,
        start_date: period.start_date,
        end_date: period.end_date,
        created_at: now,
        updated_at: now,
      })
      .execute()
    console.log("created period")
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

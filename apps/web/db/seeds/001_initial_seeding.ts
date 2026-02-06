import { createHash, randomUUID } from "node:crypto"
import { encrypt } from "../../src/lib/server/encryption"
import { readFile } from "node:fs/promises"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import {
  addDays,
  addMonths,
  subDays,
  subMonths,
} from "date-fns"
import * as v from "valibot"
import {
  CONTRACT_FILE_TYPE,
  type ContractFileType,
} from "../../src/lib/contract_file_type.ts"
import { CONTRACT_STATE } from "../../src/lib/contract_state.ts"
import { CONTRACT_TYPE } from "../../src/lib/contract_type"
import { get_month, get_year } from "../../src/lib/date.ts"
import { compose_point } from "../../src/lib/server/point.ts"
import { PROPERTY_DESTINY } from "../../src/lib/property_destiny.ts"
import { PROPERTY_FILE_TYPE } from "../../src/lib/property_file_type.ts"
import { PROPERTY_STATE } from "../../src/lib/property_state.ts"
import { PROPERTY_TYPE } from "../../src/lib/property_type.ts"
import {
  RATE_TYPE,
  type RateType,
} from "../../src/lib/rate_type.ts"
import {
  ROOM_TYPE,
  type RoomType,
} from "../../src/lib/room_type.ts"
import {
  SERVICE_TYPE,
  type ServiceType,
} from "../../src/lib/service.ts"
import { SLOT_STATE } from "../../src/lib/slot_state.ts"
import { USER_FILE_TYPE } from "../../src/lib/user_file_type.ts"
import { COURT } from "../../src/lib/court.ts"
import { ACCESS_TYPE } from "../../src/lib/access_type.ts"
import { query_builder } from "../query_builder"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function compose_file_path(basename: string) {
  return `${__dirname}/../files/${basename}`
}

function get_mime_type(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase()
  const mime_map: Record<string, string> = {
    pdf: "application/pdf",
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
  }
  return mime_map[ext || ""] || "application/octet-stream"
}

async function upsert_file(path: string) {
  const content = await readFile(path)
  const now = new Date()
  const hash = createHash("sha256")
    .update(content)
    .digest("hex")
  const basename = v.parse(
    v.string("basename is required"),
    path.split("/").pop(),
  )
  const mime = get_mime_type(path)
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
      name: encrypt(name),
      surname: encrypt(surname),
      phone_number: encrypt(phone_number),
      document_number: encrypt(String(document_number)),
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created user with id ${user.id}`)
  return user.id
}

async function assign_property_access(
  property_id: number,
  user_id: number,
  type: number,
  now: string,
) {
  await query_builder
    .insertInto("property_access")
    .values({
      property_id,
      user_id,
      type,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(`assigned property_access: user ${user_id} -> property ${property_id} (type: ${type})`)
}

async function create_realtor_organization(
  name: string,
  user_id: number,
  role: string,
  now: string,
) {
  const organization_id = randomUUID()
  const member_id = randomUUID()
  await query_builder
    .insertInto("organization")
    .values({
      id: organization_id,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-"),
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log("created organization", organization_id)
  await query_builder
    .insertInto("member")
    .values({
      id: member_id,
      organization_id,
      user_id,
      role,
      created_at: now,
      updated_at: now,
    })
    .execute()
  console.log(`added user ${user_id} as ${role} to organization`)
  return organization_id
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
      type: CONTRACT_TYPE.LONG_TERM,
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
  manager_id: number,
  candidate_id: number,
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
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.EDITING,
      start_date: contract_start_date,
      end_date: contract_end_date,
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.IPC,
      escalation_duration: "P3M",
      cbu: "0000003100010000000001",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
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
  const SLOTS: { start_date: Date; end_date: Date }[] = [
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
  let first_slot_id: number | null = null
  for (const slot_ of SLOTS) {
    const slot = await query_builder
      .insertInto("slot")
      .values({
        property_id,
        event_id:
          "NHN2NmxmN3Y1dmt0cjFzNWF2NmprbWw0OTAgbmljb2xhcy5hY2NldHRhQG0",
        host_id: manager_id,
        state: SLOT_STATE.FREE,
        start_date: slot_.start_date,
        end_date: slot_.end_date,
        created_at: now,
        updated_at: now,
      })
      .returning("id")
      .executeTakeFirstOrThrow()
    if (first_slot_id === null) {
      first_slot_id = slot.id
    }
    console.log("slot created", slot.id)
  }
  await query_builder
    .updateTable("slot")
    .set({
      visitant_id: candidate_id,
      state: SLOT_STATE.RESERVED,
      updated_at: now,
    })
    .where("id", "=", first_slot_id!)
    .execute()
  console.log("assigned candidate to first slot")
  console.log("created period", period.id)
  return contract
}

async function run() {
  console.log("seeding")
  const now = new Date().toISOString()
  console.log("creating users")
  const landlord_id = await upsert_user({
    surname: "Andrea",
    name: "Medina",
    phone_number: "+5491125597648",
    document_number: 36829114,
    now,
    email: "nicolas.accetta+landlord@gmail.com",
  })
  const manager_id = await upsert_user({
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
    email: "nicolas.accetta@gmail.com",
  })
  const candidate_id = await upsert_user({
    surname: "Candidato",
    name: "Juan",
    phone_number: "+5491155667788",
    document_number: 40123456,
    now,
    email: "nicolas.accetta+candidate@gmail.com",
  })
  const latitude = -34.595834
  const longitude = -58.447219
  const address =
    "1180, Padilla, Villa Crespo, Buenos Aires, Distrito Audiovisual, Comuna 15, Autonomous City of Buenos Aires, C1414CXE, Argentina"
  const location = await query_builder
    .insertInto("location")
    .values({
      address,
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
      destinies: [PROPERTY_DESTINY.RESIDENTIAL],
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
  const services: { type: ServiceType; code: string }[] = [
    {
      type: SERVICE_TYPE.MUNICIPAL_FEE,
      code: "0070039841684",
    },
    { type: SERVICE_TYPE.LIGHT, code: "004660340" },
    { type: SERVICE_TYPE.GAS, code: "030010294440" },
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
  // Create the realtor organization and add manager as member
  await create_realtor_organization(
    "Habita Inmobiliaria",
    manager_id,
    "manager",
    now,
  )
  // Assign property-level access
  await assign_property_access(
    property.id,
    manager_id,
    ACCESS_TYPE.MANAGER,
    now,
  )
  const finished_contract = await make_finished_contract(
    property.id,
    now,
  )
  const editing_contract = await make_editing_contract(
    property.id,
    now,
    manager_id,
    candidate_id,
  )
  const CONTRACT_FILES: {
    type: ContractFileType
    path: string
  }[] = [
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
  console.log("creating user file for credit report")
  const credit_report_file_id = await upsert_file(
    compose_file_path("credit_report.pdf"),
  )
  await query_builder
    .insertInto("user_file")
    .values({
      file_id: credit_report_file_id,
      user_id: candidate_id,
      created_at: now,
      updated_at: now,
      type: USER_FILE_TYPE.CREDIT_REPORT,
    })
    .execute()
  console.log("created user file")
  console.log(
    "creating nicolas accetta file for credit report",
  )
  await query_builder
    .insertInto("user_file")
    .values({
      file_id: credit_report_file_id,
      user_id: manager_id,
      created_at: now,
      updated_at: now,
      type: USER_FILE_TYPE.CREDIT_REPORT,
    })
    .execute()
  console.log("created user file")
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
      type: CONTRACT_TYPE.LONG_TERM,
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
  console.log("creating receipts for previous month")
  const previous_month = subMonths(date, 1)
  const receipt_file_id = await upsert_file(
    compose_file_path("property_image_1.webp"),
  )
  const receipt_types = [
    SERVICE_TYPE.MUNICIPAL_FEE,
    SERVICE_TYPE.LIGHT,
    SERVICE_TYPE.GAS,
    4,
  ]
  for (const type of receipt_types) {
    await query_builder
      .insertInto("receipt")
      .values({
        contract_id: contract.id,
        file_id: receipt_file_id,
        type,
        created_at: previous_month,
        updated_at: previous_month,
      })
      .execute()
    console.log(`created receipt for type ${type}`)
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

/**
 * CASE C: Published Property with Candidates
 *
 * Scenario: A property ready to be rented with active candidate interest.
 *
 * - Property with manager and owner (no tenant yet)
 * - Contract fully completed (state: finished)
 * - Property state: published
 * - 10 future visit slots created by manager
 * - 5 slots reserved by 5 different candidates
 * - Each candidate has complete profile + credit_report.pdf
 *
 * Use this case to test the visit booking flow, candidates list,
 * and the "assign as tenant" action.
 */

import type { Kysely } from "kysely"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import {
  addDays,
  addMonths,
  setHours,
  setMinutes,
} from "date-fns"
import type { DB } from "../types"
import { CONTRACT_FILE_TYPE } from "../../src/lib/contract_file_type"
import { CONTRACT_STATE } from "../../src/lib/contract_state"
import { CONTRACT_TYPE } from "../../src/lib/contract_type"
import { COURT } from "../../src/lib/court"
import { PROPERTY_DESTINY } from "../../src/lib/property_destiny"
import { PROPERTY_FILE_TYPE } from "../../src/lib/property_file_type"
import { PROPERTY_STATE } from "../../src/lib/property_state"
import { PROPERTY_TYPE } from "../../src/lib/property_type"
import { RATE_TYPE } from "../../src/lib/rate_type"
import { ROOM_TYPE } from "../../src/lib/room_type"
import { SERVICE_TYPE } from "../../src/lib/service"
import { USER_FILE_TYPE } from "../../src/lib/user_file_type"
import { PROPERTY_TAG_TYPE } from "../../src/lib/property_tag_type"
import { WARRANTY_TYPE } from "../../src/lib/warranty_type"
import * as seeder from "../../src/lib/seeder"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function compose_file_path(basename: string) {
  return `${__dirname}/../files/${basename}`
}

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log(
    "seeding case_c: published property with candidates",
  )
  const date = new Date()
  const credit_report_id = await seeder.upload_file(
    compose_file_path("credit_report.pdf"),
  )

  // Create manager and owner
  const manager_id = await seeder.create_user({
    name: "Fernando",
    surname: "Silva",
    email: "nicolas.accetta+c_manager@gmail.com",
    phone_number: "+5491155003001",
    document_number: 29678901,
  })

  const owner_id = await seeder.create_user({
    name: "Silvia",
    surname: "Pérez",
    email: "nicolas.accetta+c_owner@gmail.com",
    phone_number: "+5491155003002",
    document_number: 24567890,
  })

  // Create 5 candidates with complete profiles
  const candidates = [
    {
      name: "Martín",
      surname: "Acosta",
      email: "nicolas.accetta+c_cand1@gmail.com",
      phone: "+5491155003101",
      dni: 36123456,
    },
    {
      name: "Camila",
      surname: "Romero",
      email: "nicolas.accetta+c_cand2@gmail.com",
      phone: "+5491155003102",
      dni: 37234567,
    },
    {
      name: "Nicolás",
      surname: "Herrera",
      email: "nicolas.accetta+c_cand3@gmail.com",
      phone: "+5491155003103",
      dni: 35345678,
    },
    {
      name: "Lucía",
      surname: "Castro",
      email: "nicolas.accetta+c_cand4@gmail.com",
      phone: "+5491155003104",
      dni: 38456789,
    },
    {
      name: "Tomás",
      surname: "Vargas",
      email: "nicolas.accetta+c_cand5@gmail.com",
      phone: "+5491155003105",
      dni: 34567890,
    },
  ]

  const candidate_ids: number[] = []
  for (const c of candidates) {
    const id = await seeder.create_user({
      name: c.name,
      surname: c.surname,
      email: c.email,
      phone_number: c.phone,
      document_number: c.dni,
    })
    await seeder.add_user_file(
      id,
      credit_report_id,
      USER_FILE_TYPE.CREDIT_REPORT,
    )
    candidate_ids.push(id)
  }

  // Create location and property
  const location_id = await seeder.create_location({
    address:
      "Av. Rivadavia 5678, Caballito, Buenos Aires, Argentina",
    latitude: -34.6219429,
    longitude: -58.4442335,
    road: "Av. Rivadavia",
    house_number: 5678,
    suburb: "Caballito",
    state: "Buenos Aires",
  })

  const property_id = await seeder.create_property({
    location_id,
    state: PROPERTY_STATE.PUBLISHED,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "3C",
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  // Add rooms
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "5.5",
    length: "4.5",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.0",
    length: "3.5",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.0",
    length: "1.8",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.KITCHEN,
    width: "3.0",
    length: "2.5",
  })

  // Add services
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-345678",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.GAS,
    code: "G-901234",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.MUNICIPAL_FEE,
    code: "ABL-567890",
  })

  // Add property photos
  const photo1_id = await seeder.upload_file(
    compose_file_path("property_image_1.webp"),
  )
  const photo2_id = await seeder.upload_file(
    compose_file_path("property_image_2.webp"),
  )
  await seeder.add_property_file(
    property_id,
    photo1_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.add_property_file(
    property_id,
    photo2_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )

  // Add tags
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.CONTRAFRENTE,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.ASCENSOR,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.RAMPA,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.COCINA_ELECTRICA,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.TIRO_BALANCEADO,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.SEGURIDAD,
  )
  // Set property members (no tenant yet)
  await seeder.set_manager(property_id, manager_id)
  await seeder.set_owner(property_id, owner_id)

  // Create warranty (income warranty type with 2 guarantors)
  const warranty_id = await seeder.create_warranty(
    WARRANTY_TYPE.INCOME,
  )
  const income_warranty_id =
    await seeder.create_income_warranty(warranty_id)
  await seeder.add_income_guarantor(income_warranty_id, {
    name: "Ricardo Fernández",
    dni: "23456789",
    email: "nicolas.accetta+c_guar1@gmail.com",
  })
  await seeder.add_income_guarantor(income_warranty_id, {
    name: "Patricia Gómez",
    dni: "24567890",
    email: "nicolas.accetta+c_guar2@gmail.com",
  })

  // Create finished contract (ready to publish)
  const contract_start = addMonths(date, 1)
  const contract_end = addMonths(date, 13)

  const contract_id = await seeder.create_contract(
    property_id,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.FINISHED,
      start_date: contract_start,
      end_date: contract_end,
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.ICL,
      escalation_duration: "P3M",
      cbu: "0000003100020000000002",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
      warranty_id,
    },
  )

  await seeder.create_period(contract_id, {
    price: 480000,
    start_date: contract_start,
    end_date: addMonths(contract_start, 3),
  })

  // Add contract document
  const contract_pdf_id = await seeder.upload_file(
    compose_file_path("contract.pdf"),
  )
  await seeder.add_contract_file(
    contract_id,
    contract_pdf_id,
    CONTRACT_FILE_TYPE.CONTRACT,
  )

  // Create 10 future visit slots (next 5 days, 2 slots per day)
  const event_id = "case_c_calendar_event"
  const slot_ids: number[] = []

  for (let day = 1; day <= 5; day++) {
    const slot_date = addDays(date, day + 7) // Start a week from now

    // Morning slot: 10:00 - 10:30
    const morning_start = setMinutes(
      setHours(slot_date, 10),
      0,
    )
    const morning_end = setMinutes(
      setHours(slot_date, 10),
      30,
    )
    const morning_slot_id = await seeder.create_slot(
      property_id,
      manager_id,
      {
        event_id,
        start_date: morning_start,
        end_date: morning_end,
      },
    )
    slot_ids.push(morning_slot_id)

    // Afternoon slot: 16:00 - 16:30
    const afternoon_start = setMinutes(
      setHours(slot_date, 16),
      0,
    )
    const afternoon_end = setMinutes(
      setHours(slot_date, 16),
      30,
    )
    const afternoon_slot_id = await seeder.create_slot(
      property_id,
      manager_id,
      {
        event_id,
        start_date: afternoon_start,
        end_date: afternoon_end,
      },
    )
    slot_ids.push(afternoon_slot_id)
  }

  // Reserve first 5 slots for the 5 candidates
  for (let i = 0; i < 5; i++) {
    await seeder.reserve_slot(slot_ids[i], candidate_ids[i])
  }

  console.log("case_c seeding complete")
}

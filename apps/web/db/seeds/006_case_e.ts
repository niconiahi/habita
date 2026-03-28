/**
 * CASE E: Candidate Selection Phase
 *
 * Scenario: Visits have happened, manager needs to pick a tenant.
 *
 * - Property is published
 * - All visit slots are in the PAST
 * - 3 candidates have visited (all with complete profiles + credit reports)
 * - No tenant assigned yet
 * - Manager needs to pick one via /admin/candidates
 *
 * Use this case to test the candidate review and tenant assignment flow.
 */

import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import {
  addMonths,
  setHours,
  setMinutes,
  subDays,
} from "date-fns"
import type { Kysely } from "kysely"
import { CONTRACT_FILE_TYPE } from "../../src/lib/contract_file_type"
import { CONTRACT_STATE } from "../../src/lib/contract_state"
import { CONTRACT_TYPE } from "../../src/lib/contract_type"
import { COURT } from "../../src/lib/court"
import { PROPERTY_DESTINY } from "../../src/lib/property_destiny"
import { PROPERTY_FILE_TYPE } from "../../src/lib/property_file_type"
import { PROPERTY_STATE } from "../../src/lib/property_state"
import { PROPERTY_TAG_TYPE } from "../../src/lib/property_tag_type"
import { PROPERTY_TYPE } from "../../src/lib/property_type"
import { RATE_TYPE } from "../../src/lib/rate_type"
import { ROOM_TYPE } from "../../src/lib/room_type"
import * as seeder from "../../src/lib/seeder"
import { USER_FILE_TYPE } from "../../src/lib/user_file_type"
import { WARRANTY_TYPE } from "../../src/lib/warranty_type"
import type { DB } from "../types"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function compose_file_path(basename: string) {
  return `${__dirname}/../files/${basename}`
}

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log("seeding case_e: candidate selection phase")
  const date = new Date()
  const credit_report_id = await seeder.upload_file(
    compose_file_path("credit_report.pdf"),
  )

  // Create manager and owner
  const manager_id = await seeder.create_user({
    name: "Paula",
    surname: "Méndez",
    email: "nicolas.accetta+e_manager@gmail.com",
    phone_number: "+5491155005001",
    document_number: 31234567,
  })

  const owner_id = await seeder.create_user({
    name: "Ricardo",
    surname: "Suárez",
    email: "nicolas.accetta+e_owner@gmail.com",
    phone_number: "+5491155005002",
    document_number: 26789012,
  })

  // Create 3 candidates who have already visited
  const candidates = [
    {
      name: "Ana",
      surname: "Molina",
      email: "nicolas.accetta+e_cand1@gmail.com",
      phone: "+5491155005101",
      dni: 33111222,
    },
    {
      name: "Bruno",
      surname: "Giménez",
      email: "nicolas.accetta+e_cand2@gmail.com",
      phone: "+5491155005102",
      dni: 34222333,
    },
    {
      name: "Clara",
      surname: "Navarro",
      email: "nicolas.accetta+e_cand3@gmail.com",
      phone: "+5491155005103",
      dni: 35333444,
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
      "Bartolomé Mitre 3964, Almagro, Buenos Aires, Argentina",
    latitude: -34.6099883,
    longitude: -58.4222331,
    road: "Bartolomé Mitre",
    house_number: 3964,
    suburb: "Almagro",
    state: "Buenos Aires",
  })

  const property_id = await seeder.create_property({
    location_id,
    state: PROPERTY_STATE.PUBLISHED,
    type: PROPERTY_TYPE.HOUSE,
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  // Add rooms
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "6.0",
    length: "5.5",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.5",
    length: "4.0",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.0",
    length: "3.5",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.5",
    length: "2.0",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.KITCHEN,
    width: "4.0",
    length: "3.0",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.DINING_ROOM,
    width: "5.0",
    length: "3.0",
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
    PROPERTY_TAG_TYPE.COCHERA,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.COCINA_A_GAS,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.TERMOTANQUE,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.ESTUFA_A_GAS,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.PILETA,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.APTO_PERRO,
  )
  // Set property members (no tenant - that's the point!)
  await seeder.set_manager(property_id, manager_id)
  await seeder.set_owner(property_id, owner_id)

  // Create warranty
  const warranty_id = await seeder.create_warranty(
    WARRANTY_TYPE.INCOME,
  )
  const income_warranty_id =
    await seeder.create_income_warranty(warranty_id)
  await seeder.add_income_guarantor(income_warranty_id, {
    name: "Eduardo Molina",
    dni: "25678901",
    email: "nicolas.accetta+e_guar1@gmail.com",
  })

  // Create finished contract
  const contract_start = addMonths(date, 1)
  const contract_end = addMonths(date, 25)

  const contract_id = await seeder.create_contract(
    property_id,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.FINISHED,
      start_date: contract_start,
      end_date: contract_end,
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.IPC,
      escalation_duration: "P3M",
      cbu: "0000003100030000000003",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
      warranty_id,
    },
  )

  await seeder.create_period(contract_id, {
    price: 650000,
    start_date: contract_start,
    end_date: addMonths(contract_start, 3),
  })

  const contract_pdf_id = await seeder.upload_file(
    compose_file_path("contract.pdf"),
  )
  await seeder.add_contract_file(
    contract_id,
    contract_pdf_id,
    CONTRACT_FILE_TYPE.CONTRACT,
  )

  // Create 3 PAST visit slots (visits already happened)
  const event_id = "case_e_past_visits"

  for (let i = 0; i < 3; i++) {
    const past_date = subDays(date, i + 3) // 3, 4, 5 days ago
    const slot_start = setMinutes(
      setHours(past_date, 11),
      0,
    )
    const slot_end = setMinutes(setHours(past_date, 11), 30)

    const slot_id = await seeder.create_slot(
      property_id,
      manager_id,
      {
        event_id,
        start_date: slot_start,
        end_date: slot_end,
      },
    )

    // Each candidate reserved and visited
    await seeder.reserve_slot(slot_id, candidate_ids[i])
  }

  console.log("case_e seeding complete")
}

/**
 * CASE A: Active Rental (Freelance Manager)
 *
 * Scenario: A complete, happy-path rental situation.
 *
 * - Freelance manager (no organization)
 * - Property with tenant, manager, and owner
 * - Fully complete contract (state: active)
 * - Fully filled property data (rooms, services)
 * - Property state: rented
 *
 * Use this case to test the tenant payment page, active contract views,
 * and the full rental lifecycle.
 */

import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { addMonths, subMonths } from "date-fns"
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
import { FLOOR_NUMBER } from "../../src/lib/floor_number"
import { ROOM_TYPE } from "../../src/lib/room_type"
import * as seeder from "../../src/lib/seeder"
import { SERVICE_TYPE } from "../../src/lib/service"
import { USER_FILE_TYPE } from "../../src/lib/user_file_type"
import { WARRANTY_TYPE } from "../../src/lib/warranty_type"
import type { DB } from "../types"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function compose_file_path(basename: string) {
  return `${__dirname}/../files/${basename}`
}

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log(
    "seeding case_a: active rental (freelance manager)",
  )
  const date = new Date()

  // Create users
  const manager_id = await seeder.create_user({
    name: "Carlos",
    surname: "Fernández",
    email: "nicolas.accetta+a_manager@gmail.com",
    phone_number: "+5491155001001",
    document_number: 28456789,
  })

  const owner_id = await seeder.create_user({
    name: "María",
    surname: "González",
    email: "nicolas.accetta+a_owner@gmail.com",
    phone_number: "+5491155001002",
    document_number: 25123456,
  })

  const tenant_id = await seeder.create_user({
    name: "Lucas",
    surname: "Rodríguez",
    email: "nicolas.accetta+a_tenant@gmail.com",
    phone_number: "+5491155001003",
    document_number: 35789012,
  })

  // Upload credit report for tenant
  const credit_report_id = await seeder.upload_file(
    compose_file_path("credit_report.pdf"),
  )
  await seeder.add_user_file(
    tenant_id,
    credit_report_id,
    USER_FILE_TYPE.CREDIT_REPORT,
  )

  // Create location and property
  const location_id = await seeder.create_location({
    address: "Paso, Balvanera, Buenos Aires, Argentina",
    latitude: -34.6092155,
    longitude: -58.4031396,
    road: "Paso",
    house_number: 0,
    suburb: "Balvanera",
    state: "Buenos Aires",
  })

  const property_id = await seeder.create_property({
    location_id,
    state: PROPERTY_STATE.RENTED,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "5A",
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  // Add floors
  const ground_floor_id = await seeder.add_floor(
    property_id,
    { number: FLOOR_NUMBER.GROUND },
  )
  const first_floor_id = await seeder.add_floor(
    property_id,
    { number: 1 },
  )

  // Add rooms
  await seeder.add_room(ground_floor_id, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "5.0",
    length: "4.5",
  })
  await seeder.add_room(ground_floor_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.0",
    length: "3.5",
  })
  await seeder.add_room(ground_floor_id, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.5",
    length: "2.0",
  })
  await seeder.add_room(first_floor_id, {
    type: ROOM_TYPE.KITCHEN,
    width: "3.0",
    length: "2.5",
  })

  // Add services
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-123456",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.GAS,
    code: "G-789012",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.MUNICIPAL_FEE,
    code: "ABL-345678",
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
    PROPERTY_TAG_TYPE.CON_BALCON,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.ASCENSOR,
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
    PROPERTY_TAG_TYPE.AIRE_ACONDICIONADO,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.APTO_GATO,
  )
  // Set property members (freelance manager - no organization)
  await seeder.set_manager(property_id, manager_id)
  await seeder.set_owner(property_id, owner_id)
  await seeder.set_tenant(property_id, tenant_id)

  // Create warranty (property warranty type)
  const warranty_location_id = await seeder.create_location(
    {
      address:
        "Av. Santa Fe 4567, Palermo, Buenos Aires, Argentina",
      latitude: -34.57873618367347,
      longitude: -58.42479412857143,
      road: "Av. Santa Fe",
      house_number: 4567,
      suburb: "Palermo",
      state: "Buenos Aires",
    },
  )

  const warranty_id = await seeder.create_warranty(
    WARRANTY_TYPE.PROPERTY,
  )
  await seeder.create_property_warranty(
    warranty_id,
    warranty_location_id,
    {
      guarantor_name: "Roberto González",
      guarantor_dni: "20456789",
      guarantor_email:
        "nicolas.accetta+a_guarantor@gmail.com",
      cadastral_district: "15",
      cadastral_section: "A",
      cadastral_block: "123",
      cadastral_parcel: "45",
      property_tax_id: "PTX-2024-001234",
    },
  )

  // Create active contract (started 3 months ago, ends in 9 months)
  const contract_start = subMonths(date, 3)
  const contract_end = addMonths(date, 9)

  const contract_id = await seeder.create_contract(
    property_id,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.ACTIVE,
      start_date: contract_start,
      end_date: contract_end,
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.IPC,
      escalation_duration: "P3M",
      cbu: "0000003100010000000001",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
      warranty_id,
    },
  )

  // Create periods (first period already passed, second is current)
  await seeder.create_period(contract_id, {
    price: 500000,
    start_date: contract_start,
    end_date: date,
  })
  await seeder.create_period(contract_id, {
    price: 550000,
    start_date: date,
    end_date: addMonths(date, 3),
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

  console.log("case_a seeding complete")
}

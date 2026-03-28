/**
 * CASE B: Complete Contract (Editing)
 *
 * Scenario: A fully configured contract ready for PDF generation.
 *
 * - Property with manager, owner, and tenant assigned
 * - Contract in editing state with all fields filled
 * - Warranty, periods, and all contract data present
 * - Property state: editing
 *
 * Use this case to test the full contract editing flow,
 * PDF generation, and digital signature integration.
 */

import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { addMonths } from "date-fns"
import type { Kysely } from "kysely"
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
  console.log("seeding case_b: contract in progress")
  const date = new Date()

  // Create users
  const manager_id = await seeder.create_user({
    name: "Alejandra",
    surname: "Martínez",
    email: "nicolas.accetta+b_manager@gmail.com",
    phone_number: "+5491155002001",
    document_number: 30567890,
  })

  const owner_id = await seeder.create_user({
    name: "Jorge",
    surname: "López",
    email: "nico+owner@habita.rent",
    phone_number: "+5491155002002",
    document_number: 22345678,
    cuil: "20000000019",
  })

  const tenant_id = await seeder.create_user({
    name: "Valentina",
    surname: "Díaz",
    email: "nico+tenant@habita.rent",
    phone_number: "+5491155002003",
    document_number: 38901234,
    cuil: "20000000019",
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
    address:
      "Av. Cabildo 2500, Belgrano, Buenos Aires, Argentina",
    latitude: -34.55853915,
    longitude: -58.46008519965665,
    road: "Av. Cabildo",
    house_number: 2500,
    suburb: "Belgrano",
    state: "Buenos Aires",
  })

  const property_id = await seeder.create_property({
    location_id,
    state: PROPERTY_STATE.EDITING,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "12B",
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  // Add rooms (property is fully configured)
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "6.0",
    length: "5.0",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.5",
    length: "4.0",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "3.5",
    length: "3.0",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.5",
    length: "2.0",
  })
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.KITCHEN,
    width: "3.5",
    length: "3.0",
  })

  // Add services
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-234567",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.GAS,
    code: "G-890123",
  })

  // Add property photos
  const photo1_id = await seeder.upload_file(
    compose_file_path("property_image_1.webp"),
  )
  await seeder.add_property_file(
    property_id,
    photo1_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )

  // Add tags
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.A_ESTRENAR,
  )
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
    PROPERTY_TAG_TYPE.BAULERA,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.COCHERA,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.AMOBLADO,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.HELADERA,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.AIRE_ACONDICIONADO,
  )
  // Set property members
  await seeder.set_manager(property_id, manager_id)
  await seeder.set_owner(property_id, owner_id)
  await seeder.set_tenant(property_id, tenant_id)

  // Create warranty (surety type)
  const warranty_id = await seeder.create_warranty(
    WARRANTY_TYPE.SURETY,
  )
  await seeder.create_surety_warranty(warranty_id, {
    guarantor_name: "Ana Peralta",
    guarantor_dni: "27654321",
    guarantor_email:
      "nicolas.accetta+b_guarantor@gmail.com",
    company_name: "Fianzas del Sur S.A.",
    policy_number: "POL-2025-00567",
    company_email: "nicolas.accetta+b_surety@gmail.com",
  })

  // Create contract with all fields filled
  const contract_start = addMonths(date, 1)
  const contract_end = addMonths(date, 13)

  const contract_id = await seeder.create_contract(
    property_id,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.EDITING,
      start_date: contract_start,
      end_date: contract_end,
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.IPC,
      escalation_duration: "P3M",
      cbu: "0000003100020000000002",
      fine_amount: 3,
      percentage_return: 100,
      early_termination: 3,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
      warranty_id,
    },
  )

  // Create initial period
  await seeder.create_period(contract_id, {
    price: 450000,
    start_date: contract_start,
    end_date: addMonths(contract_start, 3),
  })

  console.log("case_b seeding complete")
}

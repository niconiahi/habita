/**
 * CASE F: Active Contract with Payment History
 *
 * Scenario: A contract that's been running for 4+ months with realistic escalation.
 *
 * - Contract is active, started 4 months ago
 * - Realistic IPC escalation applied (visible in periods)
 * - Payment receipts:
 *   - Month 1: all receipts uploaded (rent, light, gas, municipal fee)
 *   - Month 2: all receipts uploaded
 *   - Month 3: partial (rent + light only)
 *   - Month 4: none uploaded yet
 *
 * Use this case to test the tenant payment page (/admin/properties/[id]/contracts/[id]/tenant)
 * and verify escalation calculations are working correctly.
 */

import type { Kysely } from "kysely"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { addMonths, subMonths } from "date-fns"
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

// Receipt types (composed from SERVICE_TYPE + RENT)
const RECEIPT_TYPE = {
  MUNICIPAL_FEE: 0,
  WATER: 1,
  LIGHT: 2,
  GAS: 3,
  RENT: 4,
} as const

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log(
    "seeding case_f: active contract with payment history",
  )
  const date = new Date()
  const receipt_file_id = await seeder.upload_file(
    compose_file_path("insurance.pdf"),
  )

  // Create users
  const manager_id = await seeder.create_user({
    name: "Gabriel",
    surname: "Torres",
    email: "nicolas.accetta+f_manager@gmail.com",
    phone_number: "+5491155006001",
    document_number: 28901234,
  })

  const owner_id = await seeder.create_user({
    name: "Elena",
    surname: "Ríos",
    email: "nicolas.accetta+f_owner@gmail.com",
    phone_number: "+5491155006002",
    document_number: 23456789,
  })

  const tenant_id = await seeder.create_user({
    name: "Sebastián",
    surname: "Morales",
    email: "nicolas.accetta+f_tenant@gmail.com",
    phone_number: "+5491155006003",
    document_number: 36789012,
  })

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
      "Av. Scalabrini Ortiz 3456, Palermo, Buenos Aires, Argentina",
    latitude: -34.5817861,
    longitude: -58.4119049,
    road: "Av. Scalabrini Ortiz",
    house_number: 3456,
    suburb: "Palermo",
    state: "Buenos Aires",
  })

  const property_id = await seeder.create_property({
    location_id,
    state: PROPERTY_STATE.RENTED,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "8D",
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  // Add rooms
  await seeder.add_room(property_id, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "5.0",
    length: "4.0",
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
    code: "T-456789",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.GAS,
    code: "G-012345",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.MUNICIPAL_FEE,
    code: "ABL-678901",
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
    PROPERTY_TAG_TYPE.HELADERA,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.COCINA_A_GAS,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.AIRE_ACONDICIONADO,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.SUM,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.GYM,
  )
  // Set property members
  await seeder.set_manager(property_id, manager_id)
  await seeder.set_owner(property_id, owner_id)
  await seeder.set_tenant(property_id, tenant_id)

  // Create warranty
  const warranty_id = await seeder.create_warranty(
    WARRANTY_TYPE.PROPERTY,
  )
  const warranty_location_id = await seeder.create_location(
    {
      address:
        "Av. Las Heras 2345, Recoleta, Buenos Aires, Argentina",
      latitude: -34.5870684,
      longitude: -58.3966939,
      road: "Av. Las Heras",
      house_number: 2345,
      suburb: "Recoleta",
      state: "Buenos Aires",
    },
  )
  await seeder.create_property_warranty(
    warranty_id,
    warranty_location_id,
    {
      guarantor_name: "Horacio Morales",
      guarantor_dni: "21234567",
      guarantor_email: "nicolas.accetta+f_guar1@gmail.com",
      cadastral_district: "20",
      cadastral_section: "C",
      cadastral_block: "456",
      cadastral_parcel: "78",
      property_tax_id: "PTX-2024-006789",
    },
  )

  // Create active contract (started 4 months ago, IPC escalation every 3 months)
  const contract_start = subMonths(date, 4)
  const contract_end = addMonths(date, 8)

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
      cbu: "0000003100040000000004",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
      warranty_id,
    },
  )

  // Create periods with REALISTIC ESCALATION
  // Period 1: months 1-3 (base price)
  await seeder.create_period(contract_id, {
    price: 400000,
    start_date: contract_start,
    end_date: addMonths(contract_start, 3),
  })

  // Period 2: months 4-6 (escalated by ~10% based on IPC)
  await seeder.create_period(contract_id, {
    price: 440000, // 10% increase
    start_date: addMonths(contract_start, 3),
    end_date: addMonths(contract_start, 6),
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

  // Create receipts for payment history
  // Month 1: All receipts uploaded
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.RENT,
  )
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.LIGHT,
  )
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.GAS,
  )
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.MUNICIPAL_FEE,
  )

  // Month 2: All receipts uploaded
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.RENT,
  )
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.LIGHT,
  )
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.GAS,
  )
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.MUNICIPAL_FEE,
  )

  // Month 3: Partial (rent + light only)
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.RENT,
  )
  await seeder.create_receipt(
    contract_id,
    receipt_file_id,
    RECEIPT_TYPE.LIGHT,
  )

  // Month 4: None uploaded yet (current month)

  console.log("case_f seeding complete")
}

/**
 * CASE B: Contract In Progress
 *
 * Scenario: A property where the contract is still being set up.
 *
 * - Property with manager, owner, and tenant assigned
 * - Contract in editing state (~50% of fields filled)
 * - No contract.pdf generated yet
 * - Property state: editing
 *
 * Use this case to test the contract editing flow, incomplete
 * contract validation, and the "generate contract" action.
 */

import type { Kysely } from "kysely"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { addMonths } from "date-fns"
import type { DB } from "../types"
import { CONTRACT_STATE } from "../../src/lib/contract_state"
import { CONTRACT_TYPE } from "../../src/lib/contract_type"
import { PROPERTY_DESTINY } from "../../src/lib/property_destiny"
import { PROPERTY_STATE } from "../../src/lib/property_state"
import { PROPERTY_TYPE } from "../../src/lib/property_type"
import { RATE_TYPE } from "../../src/lib/rate_type"
import { ROOM_TYPE } from "../../src/lib/room_type"
import { SERVICE_TYPE } from "../../src/lib/service"
import { USER_FILE_TYPE } from "../../src/lib/user_file_type"
import { PROPERTY_FILE_TYPE } from "../../src/lib/property_file_type"
import * as seeder from "../../src/lib/seeder"

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
    email: "nicolas.accetta+b_owner@gmail.com",
    phone_number: "+5491155002002",
    document_number: 22345678,
  })

  const tenant_id = await seeder.create_user({
    name: "Valentina",
    surname: "Díaz",
    email: "nicolas.accetta+b_tenant@gmail.com",
    phone_number: "+5491155002003",
    document_number: 38901234,
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

  // Set property members
  await seeder.set_manager(property_id, manager_id)
  await seeder.set_owner(property_id, owner_id)
  await seeder.set_tenant(property_id, tenant_id)

  // Create contract in EDITING state with ~50% of fields filled
  // Missing: warranty, cbu, fine_amount, percentage_return, early_termination, court_id
  const contract_start = addMonths(date, 1)
  const contract_end = addMonths(date, 13)

  await seeder.create_contract(property_id, {
    type: CONTRACT_TYPE.LONG_TERM,
    state: CONTRACT_STATE.EDITING,
    start_date: contract_start,
    end_date: contract_end,
    destiny: PROPERTY_DESTINY.RESIDENTIAL,
    escalation_type: RATE_TYPE.IPC,
    escalation_duration: "P3M",
    showroom_hours: 2,
    // Intentionally missing: cbu, fine_amount, percentage_return, early_termination, court_id, warranty_id
  })

  // No contract.pdf - still being edited
  // No periods created yet - contract not finalized

  console.log("case_b seeding complete")
}

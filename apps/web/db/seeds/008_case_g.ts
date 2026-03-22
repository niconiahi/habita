/**
 * CASE G: Organization with Multiple Managers
 *
 * Scenario: A realtor organization with multiple managers.
 *
 * - A realtor organization (not freelance)
 * - 3 managers, each with distinct property assignments:
 *   - Manager 1: 2 properties
 *   - Manager 2: 1 property
 *   - Manager 3: 1 property
 *
 * Use this case to test /admin/realtor management (manager list, removal),
 * and verify that each manager only sees their own properties.
 */

import type { Kysely } from "kysely"
import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { addMonths } from "date-fns"
import type { DB } from "../types"
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
import { PROPERTY_TAG_TYPE } from "../../src/lib/property_tag_type"
import * as seeder from "../../src/lib/seeder"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function compose_file_path(basename: string) {
  return `${__dirname}/../files/${basename}`
}

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log(
    "seeding case_g: organization with multiple managers",
  )
  const date = new Date()

  // Create organization
  const organization_id = await seeder.create_organization(
    "Inmobiliaria Del Centro",
  )

  // Create 3 managers
  const manager1_id = await seeder.create_user({
    name: "Mariana",
    surname: "Vega",
    email: "nicolas.accetta+g_mgr1@gmail.com",
    phone_number: "+5491155007001",
    document_number: 30111222,
  })

  const manager2_id = await seeder.create_user({
    name: "Andrés",
    surname: "Cabrera",
    email: "nicolas.accetta+g_mgr2@gmail.com",
    phone_number: "+5491155007002",
    document_number: 31222333,
  })

  const manager3_id = await seeder.create_user({
    name: "Laura",
    surname: "Pacheco",
    email: "nicolas.accetta+g_mgr3@gmail.com",
    phone_number: "+5491155007003",
    document_number: 32333444,
  })

  // Add all managers to organization
  await seeder.add_member(
    organization_id,
    manager1_id,
    "manager",
  )
  await seeder.add_member(
    organization_id,
    manager2_id,
    "manager",
  )
  await seeder.add_member(
    organization_id,
    manager3_id,
    "manager",
  )

  // Create owners for properties
  const owner1_id = await seeder.create_user({
    name: "Roberto",
    surname: "Aguirre",
    email: "nicolas.accetta+g_own1@gmail.com",
    phone_number: "+5491155007101",
    document_number: 22111222,
  })

  const owner2_id = await seeder.create_user({
    name: "Susana",
    surname: "Flores",
    email: "nicolas.accetta+g_own2@gmail.com",
    phone_number: "+5491155007102",
    document_number: 23222333,
  })

  const owner3_id = await seeder.create_user({
    name: "Miguel",
    surname: "Quiroga",
    email: "nicolas.accetta+g_own3@gmail.com",
    phone_number: "+5491155007103",
    document_number: 24333444,
  })

  const owner4_id = await seeder.create_user({
    name: "Carmen",
    surname: "Delgado",
    email: "nicolas.accetta+g_own4@gmail.com",
    phone_number: "+5491155007104",
    document_number: 25444555,
  })

  const photo_id = await seeder.upload_file(
    compose_file_path("property_image_1.webp"),
  )

  // ==========================================
  // Manager 1: 2 properties
  // ==========================================

  // Property 1.1
  const location1_id = await seeder.create_location({
    address:
      "Av. Córdoba 4567, Palermo, Buenos Aires, Argentina",
    latitude: -34.59443984081633,
    longitude: -58.42958272040816,
    road: "Av. Córdoba",
    house_number: 4567,
    suburb: "Palermo",
    state: "Buenos Aires",
  })

  const property1_id = await seeder.create_property({
    location_id: location1_id,
    state: PROPERTY_STATE.PUBLISHED,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "2A",
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  await seeder.add_room(property1_id, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "4.5",
    length: "4.0",
  })
  await seeder.add_room(property1_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "3.5",
    length: "3.0",
  })
  await seeder.add_room(property1_id, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.0",
    length: "1.5",
  })
  await seeder.add_service(property1_id, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-G01-001",
  })
  await seeder.add_property_file(
    property1_id,
    photo_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.set_manager(property1_id, manager1_id)
  await seeder.set_owner(property1_id, owner1_id)
  // Add tags
  await seeder.add_property_tag(
    property1_id,
    PROPERTY_TAG_TYPE.A_ESTRENAR,
  )
  await seeder.add_property_tag(
    property1_id,
    PROPERTY_TAG_TYPE.ASCENSOR,
  )
  await seeder.add_property_tag(
    property1_id,
    PROPERTY_TAG_TYPE.AMOBLADO,
  )
  await seeder.add_property_tag(
    property1_id,
    PROPERTY_TAG_TYPE.AIRE_ACONDICIONADO,
  )
  await seeder.add_property_tag(
    property1_id,
    PROPERTY_TAG_TYPE.SEGURIDAD,
  )

  // Contract for property 1
  const contract1_start = addMonths(date, 1)
  const contract1_id = await seeder.create_contract(
    property1_id,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.FINISHED,
      start_date: contract1_start,
      end_date: addMonths(contract1_start, 24),
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.IPC,
      escalation_duration: "P3M",
      cbu: "0000003100070100000001",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
    },
  )
  await seeder.create_period(contract1_id, {
    price: 480000,
    start_date: contract1_start,
    end_date: addMonths(contract1_start, 3),
  })

  // Property 1.2
  const location2_id = await seeder.create_location({
    address:
      "Av. Santa Fe 5678, Palermo, Buenos Aires, Argentina",
    latitude: -34.5772041,
    longitude: -58.4301615,
    road: "Av. Santa Fe",
    house_number: 5678,
    suburb: "Palermo",
    state: "Buenos Aires",
  })

  const property2_id = await seeder.create_property({
    location_id: location2_id,
    state: PROPERTY_STATE.EDITING,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "7C",
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  await seeder.add_room(property2_id, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "5.0",
    length: "4.5",
  })
  await seeder.add_room(property2_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.0",
    length: "3.5",
  })
  await seeder.add_room(property2_id, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.5",
    length: "2.0",
  })
  await seeder.add_service(property2_id, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-G01-002",
  })
  await seeder.add_property_file(
    property2_id,
    photo_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.set_manager(property2_id, manager1_id)
  await seeder.set_owner(property2_id, owner2_id)
  // Add tags
  await seeder.add_property_tag(
    property2_id,
    PROPERTY_TAG_TYPE.CONTRAFRENTE,
  )
  await seeder.add_property_tag(
    property2_id,
    PROPERTY_TAG_TYPE.CON_BALCON,
  )
  await seeder.add_property_tag(
    property2_id,
    PROPERTY_TAG_TYPE.COCINA_ELECTRICA,
  )
  await seeder.add_property_tag(
    property2_id,
    PROPERTY_TAG_TYPE.TIRO_BALANCEADO,
  )

  // ==========================================
  // Manager 2: 1 property
  // ==========================================

  const location3_id = await seeder.create_location({
    address:
      "Av. Belgrano 1234, Monserrat, Buenos Aires, Argentina",
    latitude: -34.61337726734694,
    longitude: -58.383726773469384,
    road: "Av. Belgrano",
    house_number: 1234,
    suburb: "Monserrat",
    state: "Buenos Aires",
  })

  const property3_id = await seeder.create_property({
    location_id: location3_id,
    state: PROPERTY_STATE.PUBLISHED,
    type: PROPERTY_TYPE.HOUSE,
    destinies: [
      PROPERTY_DESTINY.RESIDENTIAL,
      PROPERTY_DESTINY.COMMERCIAL,
    ],
  })

  await seeder.add_room(property3_id, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "6.0",
    length: "5.0",
  })
  await seeder.add_room(property3_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.5",
    length: "4.0",
  })
  await seeder.add_room(property3_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.0",
    length: "3.5",
  })
  await seeder.add_room(property3_id, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.5",
    length: "2.0",
  })
  await seeder.add_room(property3_id, {
    type: ROOM_TYPE.KITCHEN,
    width: "4.0",
    length: "3.0",
  })
  await seeder.add_service(property3_id, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-G02-001",
  })
  await seeder.add_service(property3_id, {
    type: SERVICE_TYPE.GAS,
    code: "G-G02-001",
  })
  await seeder.add_property_file(
    property3_id,
    photo_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.set_manager(property3_id, manager2_id)
  await seeder.set_owner(property3_id, owner3_id)
  // Add tags
  await seeder.add_property_tag(
    property3_id,
    PROPERTY_TAG_TYPE.COCHERA,
  )
  await seeder.add_property_tag(
    property3_id,
    PROPERTY_TAG_TYPE.COCINA_A_GAS,
  )
  await seeder.add_property_tag(
    property3_id,
    PROPERTY_TAG_TYPE.TERMOTANQUE,
  )
  await seeder.add_property_tag(
    property3_id,
    PROPERTY_TAG_TYPE.PILETA,
  )
  await seeder.add_property_tag(
    property3_id,
    PROPERTY_TAG_TYPE.APTO_GATO,
  )
  await seeder.add_property_tag(
    property3_id,
    PROPERTY_TAG_TYPE.APTO_PERRO,
  )

  // Contract for property 3
  const contract3_start = addMonths(date, 1)
  const contract3_id = await seeder.create_contract(
    property3_id,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.FINISHED,
      start_date: contract3_start,
      end_date: addMonths(contract3_start, 24),
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.ICL,
      escalation_duration: "P6M",
      cbu: "0000003100070200000002",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
    },
  )
  await seeder.create_period(contract3_id, {
    price: 550000,
    start_date: contract3_start,
    end_date: addMonths(contract3_start, 6),
  })

  // ==========================================
  // Manager 3: 1 property
  // ==========================================

  const location4_id = await seeder.create_location({
    address:
      "Perú 1160, San Telmo, Buenos Aires, Argentina",
    latitude: -34.6214013,
    longitude: -58.37375,
    road: "Perú",
    house_number: 1160,
    suburb: "San Telmo",
    state: "Buenos Aires",
  })

  const property4_id = await seeder.create_property({
    location_id: location4_id,
    state: PROPERTY_STATE.PUBLISHED,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "1B",
    destinies: [PROPERTY_DESTINY.COMMERCIAL],
  })

  await seeder.add_room(property4_id, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "8.0",
    length: "6.0",
  })
  await seeder.add_room(property4_id, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.0",
    length: "1.5",
  })
  await seeder.add_service(property4_id, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-G03-001",
  })
  await seeder.add_property_file(
    property4_id,
    photo_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.set_manager(property4_id, manager3_id)
  await seeder.set_owner(property4_id, owner4_id)
  // Add tags
  await seeder.add_property_tag(
    property4_id,
    PROPERTY_TAG_TYPE.RAMPA,
  )
  await seeder.add_property_tag(
    property4_id,
    PROPERTY_TAG_TYPE.BAULERA,
  )
  await seeder.add_property_tag(
    property4_id,
    PROPERTY_TAG_TYPE.HELADERA,
  )
  await seeder.add_property_tag(
    property4_id,
    PROPERTY_TAG_TYPE.ESTUFA_A_GAS,
  )
  await seeder.add_property_tag(
    property4_id,
    PROPERTY_TAG_TYPE.SUM,
  )

  // Contract for property 4
  const contract4_start = addMonths(date, 1)
  const contract4_id = await seeder.create_contract(
    property4_id,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.FINISHED,
      start_date: contract4_start,
      end_date: addMonths(contract4_start, 12),
      destiny: PROPERTY_DESTINY.COMMERCIAL,
      escalation_type: RATE_TYPE.UVA,
      escalation_duration: "P3M",
      cbu: "0000003100070300000003",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
    },
  )
  await seeder.create_period(contract4_id, {
    price: 620000,
    start_date: contract4_start,
    end_date: addMonths(contract4_start, 3),
  })

  console.log("case_g seeding complete")
}

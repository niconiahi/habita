/**
 * CASE I: All Warranty Types
 *
 * Scenario: Three separate properties/contracts, one per warranty type.
 *
 * - I-1: Property warranty (garantía propietaria) - guarantor with property cadastral info
 * - I-2: Income warranty (recibo de sueldo) - 2 guarantors with income docs
 * - I-3: Surety warranty (seguro de caución) - insurance company + policy number
 *
 * Use this case to test all warranty type flows in the contract editing UI,
 * verify warranty display in contract views, and PDF generation for each type.
 */

import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { addMonths } from "date-fns"
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
  console.log("seeding case_i: all warranty types")
  const date = new Date()

  // Shared manager for all properties
  const manager_id = await seeder.create_user({
    name: "Federico",
    surname: "Blanco",
    email: "nicolas.accetta+i_manager@gmail.com",
    phone_number: "+5491155009001",
    document_number: 30999888,
  })

  const credit_report_id = await seeder.upload_file(
    compose_file_path("credit_report.pdf"),
  )
  const photo_id = await seeder.upload_file(
    compose_file_path("property_image_1.webp"),
  )
  const contract_pdf_id = await seeder.upload_file(
    compose_file_path("contract.pdf"),
  )

  // ==========================================
  // I-1: PROPERTY WARRANTY (Garantía Propietaria)
  // ==========================================
  console.log("creating I-1: property warranty")

  const owner_i1 = await seeder.create_user({
    name: "Adriana",
    surname: "Sosa",
    email: "nicolas.accetta+i1_owner@gmail.com",
    phone_number: "+5491155009101",
    document_number: 24111222,
  })

  const tenant_i1 = await seeder.create_user({
    name: "Matías",
    surname: "Ortiz",
    email: "nicolas.accetta+i1_tenant@gmail.com",
    phone_number: "+5491155009102",
    document_number: 36222333,
  })
  await seeder.add_user_file(
    tenant_i1,
    credit_report_id,
    USER_FILE_TYPE.CREDIT_REPORT,
  )

  const location_i1 = await seeder.create_location({
    address:
      "Av. Pueyrredón 1234, Recoleta, Buenos Aires, Argentina",
    latitude: -34.59624509591837,
    longitude: -58.4031738,
    road: "Av. Pueyrredón",
    house_number: 1234,
    suburb: "Recoleta",
    state: "Buenos Aires",
  })

  const property_i1 = await seeder.create_property({
    location_id: location_i1,
    state: PROPERTY_STATE.RENTED,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "9A",
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  await seeder.add_room(property_i1, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "4.5",
    length: "4.0",
  })
  await seeder.add_room(property_i1, {
    type: ROOM_TYPE.BEDROOM,
    width: "3.5",
    length: "3.0",
  })
  await seeder.add_room(property_i1, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.0",
    length: "1.5",
  })
  await seeder.add_service(property_i1, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-I1-001",
  })
  await seeder.add_property_file(
    property_i1,
    photo_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.set_manager(property_i1, manager_id)
  await seeder.set_owner(property_i1, owner_i1)
  await seeder.set_tenant(property_i1, tenant_i1)
  // Add tags
  await seeder.add_property_tag(
    property_i1,
    PROPERTY_TAG_TYPE.CON_BALCON,
  )
  await seeder.add_property_tag(
    property_i1,
    PROPERTY_TAG_TYPE.ASCENSOR,
  )
  await seeder.add_property_tag(
    property_i1,
    PROPERTY_TAG_TYPE.AMOBLADO,
  )
  await seeder.add_property_tag(
    property_i1,
    PROPERTY_TAG_TYPE.HELADERA,
  )
  await seeder.add_property_tag(
    property_i1,
    PROPERTY_TAG_TYPE.AIRE_ACONDICIONADO,
  )
  await seeder.add_property_tag(
    property_i1,
    PROPERTY_TAG_TYPE.GYM,
  )

  // Create property warranty
  const warranty_i1 = await seeder.create_warranty(
    WARRANTY_TYPE.PROPERTY,
  )
  const warranty_location_i1 = await seeder.create_location(
    {
      address:
        "Av. Callao 567, Balvanera, Buenos Aires, Argentina",
      latitude: -34.602386773469384,
      longitude: -58.39237712857143,
      road: "Av. Callao",
      house_number: 567,
      suburb: "Balvanera",
      state: "Buenos Aires",
    },
  )
  await seeder.create_property_warranty(
    warranty_i1,
    warranty_location_i1,
    {
      guarantor_name: "Jorge Sosa",
      guarantor_dni: "20111222",
      guarantor_email: "nicolas.accetta+i1_guar@gmail.com",
      cadastral_district: "18",
      cadastral_section: "B",
      cadastral_block: "789",
      cadastral_parcel: "12",
      property_tax_id: "PTX-I1-001234",
    },
  )

  const contract_start_i1 = date
  const contract_i1 = await seeder.create_contract(
    property_i1,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.ACTIVE,
      start_date: contract_start_i1,
      end_date: addMonths(contract_start_i1, 12),
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.IPC,
      escalation_duration: "P3M",
      cbu: "0000003100090100000001",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
      warranty_id: warranty_i1,
    },
  )

  await seeder.create_period(contract_i1, {
    price: 420000,
    start_date: contract_start_i1,
    end_date: addMonths(contract_start_i1, 3),
  })
  await seeder.add_contract_file(
    contract_i1,
    contract_pdf_id,
    CONTRACT_FILE_TYPE.CONTRACT,
  )

  // ==========================================
  // I-2: INCOME WARRANTY (Recibo de Sueldo)
  // ==========================================
  console.log("creating I-2: income warranty")

  const owner_i2 = await seeder.create_user({
    name: "Beatriz",
    surname: "Medina",
    email: "nicolas.accetta+i2_owner@gmail.com",
    phone_number: "+5491155009201",
    document_number: 25222333,
  })

  const tenant_i2 = await seeder.create_user({
    name: "Pablo",
    surname: "Ramos",
    email: "nicolas.accetta+i2_tenant@gmail.com",
    phone_number: "+5491155009202",
    document_number: 37333444,
  })
  await seeder.add_user_file(
    tenant_i2,
    credit_report_id,
    USER_FILE_TYPE.CREDIT_REPORT,
  )

  const location_i2 = await seeder.create_location({
    address:
      "Av. Díaz Vélez 4567, Caballito, Buenos Aires, Argentina",
    latitude: -34.60861206530612,
    longitude: -58.43132895918367,
    road: "Av. Díaz Vélez",
    house_number: 4567,
    suburb: "Caballito",
    state: "Buenos Aires",
  })

  const property_i2 = await seeder.create_property({
    location_id: location_i2,
    state: PROPERTY_STATE.RENTED,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "4B",
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  await seeder.add_room(property_i2, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "5.0",
    length: "4.5",
  })
  await seeder.add_room(property_i2, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.0",
    length: "3.5",
  })
  await seeder.add_room(property_i2, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.5",
    length: "2.0",
  })
  await seeder.add_room(property_i2, {
    type: ROOM_TYPE.KITCHEN,
    width: "3.0",
    length: "2.5",
  })
  await seeder.add_service(property_i2, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-I2-001",
  })
  await seeder.add_service(property_i2, {
    type: SERVICE_TYPE.GAS,
    code: "G-I2-001",
  })
  await seeder.add_property_file(
    property_i2,
    photo_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.set_manager(property_i2, manager_id)
  await seeder.set_owner(property_i2, owner_i2)
  await seeder.set_tenant(property_i2, tenant_i2)
  // Add tags
  await seeder.add_property_tag(
    property_i2,
    PROPERTY_TAG_TYPE.CONTRAFRENTE,
  )
  await seeder.add_property_tag(
    property_i2,
    PROPERTY_TAG_TYPE.BAULERA,
  )
  await seeder.add_property_tag(
    property_i2,
    PROPERTY_TAG_TYPE.COCINA_ELECTRICA,
  )
  await seeder.add_property_tag(
    property_i2,
    PROPERTY_TAG_TYPE.TIRO_BALANCEADO,
  )
  await seeder.add_property_tag(
    property_i2,
    PROPERTY_TAG_TYPE.SEGURIDAD,
  )
  await seeder.add_property_tag(
    property_i2,
    PROPERTY_TAG_TYPE.APTO_GATO,
  )

  // Create income warranty with 2 guarantors
  const warranty_i2 = await seeder.create_warranty(
    WARRANTY_TYPE.INCOME,
  )
  const income_warranty_i2 =
    await seeder.create_income_warranty(warranty_i2)
  await seeder.add_income_guarantor(income_warranty_i2, {
    name: "Carlos Ramos",
    dni: "22333444",
    email: "nicolas.accetta+i2_guar1@gmail.com",
  })
  await seeder.add_income_guarantor(income_warranty_i2, {
    name: "María Ramos",
    dni: "23444555",
    email: "nicolas.accetta+i2_guar2@gmail.com",
  })

  const contract_start_i2 = date
  const contract_i2 = await seeder.create_contract(
    property_i2,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.ACTIVE,
      start_date: contract_start_i2,
      end_date: addMonths(contract_start_i2, 24),
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.ICL,
      escalation_duration: "P6M",
      cbu: "0000003100090200000002",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
      warranty_id: warranty_i2,
    },
  )

  await seeder.create_period(contract_i2, {
    price: 380000,
    start_date: contract_start_i2,
    end_date: addMonths(contract_start_i2, 6),
  })
  await seeder.add_contract_file(
    contract_i2,
    contract_pdf_id,
    CONTRACT_FILE_TYPE.CONTRACT,
  )

  // ==========================================
  // I-3: SURETY WARRANTY (Seguro de Caución)
  // ==========================================
  console.log("creating I-3: surety warranty")

  const owner_i3 = await seeder.create_user({
    name: "Claudia",
    surname: "Navarro",
    email: "nicolas.accetta+i3_owner@gmail.com",
    phone_number: "+5491155009301",
    document_number: 26333444,
  })

  const tenant_i3 = await seeder.create_user({
    name: "Rodrigo",
    surname: "Paz",
    email: "nicolas.accetta+i3_tenant@gmail.com",
    phone_number: "+5491155009302",
    document_number: 38444555,
  })
  await seeder.add_user_file(
    tenant_i3,
    credit_report_id,
    USER_FILE_TYPE.CREDIT_REPORT,
  )

  const location_i3 = await seeder.create_location({
    address:
      "Av. Juan B. Justo 7890, Villa Crespo, Buenos Aires, Argentina",
    latitude: -34.6028054,
    longitude: -58.455887,
    road: "Av. Juan B. Justo",
    house_number: 7890,
    suburb: "Villa Crespo",
    state: "Buenos Aires",
  })

  const property_i3 = await seeder.create_property({
    location_id: location_i3,
    state: PROPERTY_STATE.RENTED,
    type: PROPERTY_TYPE.DEPARTMENT,
    unit: "6C",
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  await seeder.add_room(property_i3, {
    type: ROOM_TYPE.LIVING_ROOM,
    width: "4.5",
    length: "4.0",
  })
  await seeder.add_room(property_i3, {
    type: ROOM_TYPE.BEDROOM,
    width: "3.5",
    length: "3.0",
  })
  await seeder.add_room(property_i3, {
    type: ROOM_TYPE.BATHROOM,
    width: "2.0",
    length: "1.8",
  })
  await seeder.add_service(property_i3, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-I3-001",
  })
  await seeder.add_property_file(
    property_i3,
    photo_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.set_manager(property_i3, manager_id)
  await seeder.set_owner(property_i3, owner_i3)
  await seeder.set_tenant(property_i3, tenant_i3)
  // Add tags
  await seeder.add_property_tag(
    property_i3,
    PROPERTY_TAG_TYPE.RAMPA,
  )
  await seeder.add_property_tag(
    property_i3,
    PROPERTY_TAG_TYPE.COCHERA,
  )
  await seeder.add_property_tag(
    property_i3,
    PROPERTY_TAG_TYPE.COCINA_A_GAS,
  )
  await seeder.add_property_tag(
    property_i3,
    PROPERTY_TAG_TYPE.TERMOTANQUE,
  )
  await seeder.add_property_tag(
    property_i3,
    PROPERTY_TAG_TYPE.ESTUFA_A_GAS,
  )
  await seeder.add_property_tag(
    property_i3,
    PROPERTY_TAG_TYPE.PILETA,
  )
  await seeder.add_property_tag(
    property_i3,
    PROPERTY_TAG_TYPE.APTO_PERRO,
  )

  // Create surety warranty
  const warranty_i3 = await seeder.create_warranty(
    WARRANTY_TYPE.SURETY,
  )
  await seeder.create_surety_warranty(warranty_i3, {
    company_name: "Fianzas del Sur S.A.",
    company_email: "contacto@fianzasdelsur.com.ar",
    policy_number: "POL-2024-987654",
    guarantor_name: "Eduardo Paz",
    guarantor_dni: "24555666",
    guarantor_email: "nicolas.accetta+i3_guar@gmail.com",
  })

  const contract_start_i3 = date
  const contract_i3 = await seeder.create_contract(
    property_i3,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.ACTIVE,
      start_date: contract_start_i3,
      end_date: addMonths(contract_start_i3, 12),
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.UVA,
      escalation_duration: "P3M",
      cbu: "0000003100090300000003",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
      warranty_id: warranty_i3,
    },
  )

  await seeder.create_period(contract_i3, {
    price: 350000,
    start_date: contract_start_i3,
    end_date: addMonths(contract_start_i3, 3),
  })
  await seeder.add_contract_file(
    contract_i3,
    contract_pdf_id,
    CONTRACT_FILE_TYPE.CONTRACT,
  )

  console.log("case_i seeding complete")
}

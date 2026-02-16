/**
 * CASE H: Property with Complete Visual Data
 *
 * Scenario: A property showcasing all visual/media features.
 *
 * - 6+ photos uploaded
 * - Room map fully positioned (5 rooms with x/y coordinates)
 * - Multiple services: gas, electricity, water, internet
 * - All rooms with dimensions
 *
 * Use this case to test property photo galleries, room map visualization,
 * and the property editing UI with fully populated data.
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
import * as seeder from "../../src/lib/seeder"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function compose_file_path(basename: string) {
  return `${__dirname}/../files/${basename}`
}

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log(
    "seeding case_h: property with complete visual data",
  )
  const date = new Date()

  // Create manager and owner
  const manager_id = await seeder.create_user({
    name: "Victoria",
    surname: "Santana",
    email: "nicolas.accetta+h_manager@gmail.com",
    phone_number: "+5491155008001",
    document_number: 29555666,
  })

  const owner_id = await seeder.create_user({
    name: "Ernesto",
    surname: "Luna",
    email: "nicolas.accetta+h_owner@gmail.com",
    phone_number: "+5491155008002",
    document_number: 24666777,
  })

  // Create location and property
  const location_id = await seeder.create_location({
    address:
      "Av. del Libertador 6789, Núñez, Buenos Aires, Argentina",
    latitude: -34.5496990950547,
    longitude: -58.45356634319559,
    road: "Av. del Libertador",
    house_number: 6789,
    suburb: "Núñez",
    state: "Buenos Aires",
  })

  const property_id = await seeder.create_property({
    location_id,
    state: PROPERTY_STATE.PUBLISHED,
    type: PROPERTY_TYPE.HOUSE,
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  // Add 5 rooms with dimensions
  const living_room_id = await seeder.add_room(
    property_id,
    {
      type: ROOM_TYPE.LIVING_ROOM,
      width: "7.0",
      length: "6.0",
    },
  )

  const bedroom1_id = await seeder.add_room(property_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "5.0",
    length: "4.5",
  })

  const bedroom2_id = await seeder.add_room(property_id, {
    type: ROOM_TYPE.BEDROOM,
    width: "4.5",
    length: "4.0",
  })

  const bathroom_id = await seeder.add_room(property_id, {
    type: ROOM_TYPE.BATHROOM,
    width: "3.0",
    length: "2.5",
  })

  const kitchen_id = await seeder.add_room(property_id, {
    type: ROOM_TYPE.KITCHEN,
    width: "4.5",
    length: "3.5",
  })

  // Position all rooms on the map (creating a logical floor plan layout)
  // Living room at center
  await seeder.position_room(living_room_id, {
    position_x: "200",
    position_y: "150",
  })
  // Bedroom 1 to the left of living room
  await seeder.position_room(bedroom1_id, {
    position_x: "50",
    position_y: "150",
  })
  // Bedroom 2 above bedroom 1
  await seeder.position_room(bedroom2_id, {
    position_x: "50",
    position_y: "50",
  })
  // Bathroom next to bedrooms
  await seeder.position_room(bathroom_id, {
    position_x: "150",
    position_y: "50",
  })
  // Kitchen to the right of living room
  await seeder.position_room(kitchen_id, {
    position_x: "350",
    position_y: "150",
  })

  // Add multiple services
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.LIGHT,
    code: "T-H-001",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.GAS,
    code: "G-H-001",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.WATER,
    code: "W-H-001",
  })
  await seeder.add_service(property_id, {
    type: SERVICE_TYPE.MUNICIPAL_FEE,
    code: "ABL-H-001",
  })

  // Add 6+ photos (using the 2 available files multiple times to simulate variety)
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
  // Upload more copies to get 6+ photos
  const photo3_id = await seeder.upload_file(
    compose_file_path("property_image_1.webp"),
  )
  const photo4_id = await seeder.upload_file(
    compose_file_path("property_image_2.webp"),
  )
  const photo5_id = await seeder.upload_file(
    compose_file_path("property_image_1.webp"),
  )
  const photo6_id = await seeder.upload_file(
    compose_file_path("property_image_2.webp"),
  )

  await seeder.add_property_file(
    property_id,
    photo3_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.add_property_file(
    property_id,
    photo4_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.add_property_file(
    property_id,
    photo5_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )
  await seeder.add_property_file(
    property_id,
    photo6_id,
    PROPERTY_FILE_TYPE.PHOTO,
  )

  // Set property members
  await seeder.set_manager(property_id, manager_id)
  await seeder.set_owner(property_id, owner_id)

  // Contract with period (required for published properties)
  const contract_start = addMonths(date, 1)
  const contract_id = await seeder.create_contract(
    property_id,
    {
      type: CONTRACT_TYPE.LONG_TERM,
      state: CONTRACT_STATE.FINISHED,
      start_date: contract_start,
      end_date: addMonths(contract_start, 24),
      destiny: PROPERTY_DESTINY.RESIDENTIAL,
      escalation_type: RATE_TYPE.IPC,
      escalation_duration: "P3M",
      cbu: "0000003100080000000001",
      fine_amount: 5,
      percentage_return: 100,
      early_termination: 4,
      showroom_hours: 2,
      court_id: COURT.CIUDAD_DE_BUENOS_AIRES,
    },
  )
  await seeder.create_period(contract_id, {
    price: 750000,
    start_date: contract_start,
    end_date: addMonths(contract_start, 3),
  })

  console.log("case_h seeding complete")
}

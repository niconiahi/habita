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

import { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { addMonths } from "date-fns"
import type { Kysely } from "kysely"
import { CONTRACT_STATE } from "../../src/lib/contract_state"
import { CONTRACT_TYPE } from "../../src/lib/contract_type"
import { COURT } from "../../src/lib/court"
import { PROPERTY_DESTINY } from "../../src/lib/property_destiny"
import { PROPERTY_STATE } from "../../src/lib/property_state"
import { PROPERTY_TAG_TYPE } from "../../src/lib/property_tag_type"
import { PROPERTY_TYPE } from "../../src/lib/property_type"
import { RATE_TYPE } from "../../src/lib/rate_type"
import { FLOOR_NUMBER } from "../../src/lib/floor_number"
import { ROOM_TYPE } from "../../src/lib/room_type"
import * as seeder from "../../src/lib/seeder"
import { SERVICE_TYPE } from "../../src/lib/service"
import type { DB } from "../types"

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
      "11 de Septiembre de 1888 3658, Núñez, Buenos Aires, Argentina",
    latitude: -34.5453484,
    longitude: -58.4621491,
    road: "11 de Septiembre de 1888",
    house_number: 3658,
    suburb: "Núñez",
    state: "Buenos Aires",
  })

  const property_id = await seeder.create_property({
    location_id,
    state: PROPERTY_STATE.PUBLISHED,
    type: PROPERTY_TYPE.HOUSE,
    destinies: [PROPERTY_DESTINY.RESIDENTIAL],
  })

  // Add ground floor and 5 rooms with dimensions
  const ground_floor_id = await seeder.add_floor(
    property_id,
    { number: FLOOR_NUMBER.GROUND },
  )

  const living_room_id = await seeder.add_room(
    ground_floor_id,
    {
      type: ROOM_TYPE.LIVING_ROOM,
      width: "7.0",
      length: "6.0",
    },
  )

  const bedroom1_id = await seeder.add_room(
    ground_floor_id,
    {
      type: ROOM_TYPE.BEDROOM,
      width: "5.0",
      length: "4.5",
    },
  )

  const bedroom2_id = await seeder.add_room(
    ground_floor_id,
    {
      type: ROOM_TYPE.BEDROOM,
      width: "4.5",
      length: "4.0",
    },
  )

  const bathroom_id = await seeder.add_room(
    ground_floor_id,
    {
      type: ROOM_TYPE.BATHROOM,
      width: "3.0",
      length: "2.5",
    },
  )

  const kitchen_id = await seeder.add_room(
    ground_floor_id,
    {
      type: ROOM_TYPE.KITCHEN,
      width: "4.5",
      length: "3.5",
    },
  )

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

  // Add 6+ room photos (using the 2 available files multiple times to simulate variety)
  const photo1_id = await seeder.upload_file(
    compose_file_path("property_image_1.webp"),
  )
  const photo2_id = await seeder.upload_file(
    compose_file_path("property_image_2.webp"),
  )

  await seeder.add_room_file(living_room_id, photo1_id)
  await seeder.add_room_file(bedroom1_id, photo2_id)
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

  await seeder.add_room_file(bedroom2_id, photo3_id)
  await seeder.add_room_file(bathroom_id, photo4_id)
  await seeder.add_room_file(kitchen_id, photo5_id)
  await seeder.add_room_file(living_room_id, photo6_id)

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
    PROPERTY_TAG_TYPE.ESTUFA_A_GAS,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.PILETA,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.SUM,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.SEGURIDAD,
  )
  await seeder.add_property_tag(
    property_id,
    PROPERTY_TAG_TYPE.APTO_PERRO,
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

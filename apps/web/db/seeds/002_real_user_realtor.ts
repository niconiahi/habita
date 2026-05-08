/**
 * SETUP: Add Real User to a Realtor Organization
 *
 * Creates a realtor organization and adds the real user as a manager.
 * This gives the real user two organizations (Personal + Realtor) so
 * the organization selector becomes visible in the header.
 *
 * Also creates the default "Ejemplo" team and seeds it with sample
 * managers + property assignments so the realtor can navigate
 * /admin/teams and see populated UI from the first login.
 *
 * Relationship model: property → manager → team → organization.
 * Properties are linked to the team via the assigned manager's
 * team_member row, not via property.team_id / property.realtor_id.
 */

import type { Kysely } from "kysely"
import { PROPERTY_DESTINY } from "../../src/lib/property_destiny"
import { PROPERTY_STATE } from "../../src/lib/property_state"
import { PROPERTY_TYPE } from "../../src/lib/property_type"
import * as seeder from "../../src/lib/seeder"
import type { DB } from "../types"

const REAL_USER_EMAIL = "nicolas.accetta@gmail.com"

const DEMO_MANAGERS = [
  {
    name: "Sofía",
    surname: "Martínez",
    email: "nicolas.accetta+ejemplo_sofia@gmail.com",
    phone_number: "+5491155002001",
    document_number: 31456789,
    property: {
      address:
        "Av. Cabildo, Belgrano, Buenos Aires, Argentina",
      latitude: -34.55853915,
      longitude: -58.46008519965665,
      road: "Av. Cabildo",
      house_number: 1850,
      suburb: "Belgrano",
      state: "Buenos Aires",
      unit: "8B",
    },
  },
  {
    name: "Diego",
    surname: "Pereyra",
    email: "nicolas.accetta+ejemplo_diego@gmail.com",
    phone_number: "+5491155002002",
    document_number: 29876543,
    property: {
      address:
        "Av. Scalabrini Ortiz, Palermo, Buenos Aires, Argentina",
      latitude: -34.5817861,
      longitude: -58.4119049,
      road: "Av. Scalabrini Ortiz",
      house_number: 1620,
      suburb: "Palermo",
      state: "Buenos Aires",
      unit: "3A",
    },
  },
] as const

async function seed_ejemplo_demo_data(
  organization_id: string,
  team_id: string,
): Promise<void> {
  for (const demo of DEMO_MANAGERS) {
    const manager_id = await seeder.create_user({
      name: demo.name,
      surname: demo.surname,
      email: demo.email,
      phone_number: demo.phone_number,
      document_number: demo.document_number,
    })

    await seeder.add_member(
      organization_id,
      manager_id,
      "manager",
    )
    await seeder.add_team_member(team_id, manager_id)

    const location_id = await seeder.create_location({
      address: demo.property.address,
      latitude: demo.property.latitude,
      longitude: demo.property.longitude,
      road: demo.property.road,
      house_number: demo.property.house_number,
      suburb: demo.property.suburb,
      state: demo.property.state,
    })
    const property_id = await seeder.create_property({
      location_id,
      state: PROPERTY_STATE.PUBLISHED,
      type: PROPERTY_TYPE.DEPARTMENT,
      unit: demo.property.unit,
      destinies: [PROPERTY_DESTINY.RESIDENTIAL],
    })
    await seeder.set_manager(property_id, manager_id)
  }
}

export async function seed(_db: Kysely<DB>): Promise<void> {
  console.log("adding real user to a realtor organization")

  const real_user_id =
    await seeder.find_user_by_email(REAL_USER_EMAIL)
  if (!real_user_id) {
    console.log("real user not found, skipping")
    return
  }

  const organization_id = await seeder.create_organization(
    "Inmobiliaria Demo",
  )

  await seeder.add_member(
    organization_id,
    real_user_id,
    "realtor",
  )

  const team_id = await seeder.create_team(
    organization_id,
    "Ejemplo",
  )

  await seeder.add_team_member(team_id, real_user_id)

  await seed_ejemplo_demo_data(organization_id, team_id)

  console.log(
    "added real user as realtor to Inmobiliaria Demo with Ejemplo team and demo data",
  )
}

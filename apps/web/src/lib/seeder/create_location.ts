import { query_builder } from "../../../db/query_builder"
import { compose_point } from "../server/point"

export async function create_location(data: {
  address: string
  latitude: number
  longitude: number
  road: string
  house_number: number
  suburb?: string
  state?: string
  city?: string
  town?: string
}): Promise<number> {
  const now = new Date().toISOString()
  const location = await query_builder
    .insertInto("location")
    .values({
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      point: compose_point(data.latitude, data.longitude),
      road: data.road,
      house_number: data.house_number,
      suburb: data.suburb,
      state: data.state,
      city: data.city,
      town: data.town,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created location with id ${location.id}`)
  return location.id
}

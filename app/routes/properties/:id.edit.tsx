import type { Route } from "./+types/:id"
import { Form } from "react-router"
import { fetch_property } from "./fetchers/server/property"
import { error } from "~/lib/server/error"
import * as v from "valibot"
import { query_builder } from "~/lib/server/query_builder"
import { ForceNumberSchema } from "~/lib/server/force_number"
import { RoomType } from "~/lib/server/room_type"
import {
  LocationInput,
  LocationSchema,
} from "~/components/location_input"
import { useState } from "react"
import { compose_point } from "~/lib/server/point"

const INTENT = {
  UPDATE_ROOM: "update_room",
  DESTROY_ROOM: "destroy_room",
  CREATE_ROOM: "create_room",
  UPDATE_LOCATION: "update_location",
} as const

export async function action({
  request,
  params,
}: Route.ActionArgs) {
  const form_data = await request.formData()
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  const now = new Date()
  const id = v.parse(ForceNumberSchema, params.id, {
    message: "property id should be a number",
  })
  switch (intent) {
    case INTENT.UPDATE_ROOM: {
      const length = v.parse(
        ForceNumberSchema,
        form_data.get("length"),
      )
      const width = v.parse(
        ForceNumberSchema,
        form_data.get("width"),
      )
      const id = v.parse(
        ForceNumberSchema,
        form_data.get("id"),
      )
      await query_builder
        .updateTable("room")
        .set({ width, length, updated_at: new Date() })
        .where("room.id", "=", id)
        .execute()
      return null
    }
    case INTENT.DESTROY_ROOM: {
      const id = v.parse(
        ForceNumberSchema,
        form_data.get("id"),
      )
      await query_builder
        .deleteFrom("room")
        .where("room.id", "=", id)
        .execute()
      return null
    }
    case INTENT.CREATE_ROOM: {
      await query_builder
        .insertInto("room")
        .values({
          width: 0,
          length: 0,
          type: RoomType.BEDROOM,
          updated_at: now,
          created_at: now,
          property_id: id,
        })
        .execute()
      return null
    }
    case INTENT.UPDATE_LOCATION: {
      const id = v.parse(
        ForceNumberSchema,
        form_data.get("id"),
      )
      const location = v.parse(
        LocationSchema,
        JSON.parse(form_data.get("location") as string),
      )
      const now = new Date()
      await query_builder
        .updateTable("location")
        .set({
          id,
          latitude: location.lat,
          longitude: location.lon,
          point: compose_point(location.lat, location.lon),
          house_number: location.address.house_number,
          address: location.display_name,
          road: location.address.road,
          city: location.address.city,
          town: location.address.town,
          state: location.address.state,
          suburb: location.address.suburb,
          updated_at: now,
        })
        .where("location.id", "=", id)
        .execute()
      return null
    }
  }
  return null
}

export async function loader({ params }: Route.LoaderArgs) {
  const id = v.parse(ForceNumberSchema, params.id, {
    message: "property id should be a number",
  })
  const property = await fetch_property(id)
  if (!property) {
    throw new Error(`property does not exist for id ${id}`)
  }
  return { property }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { property } = loaderData
  const [disabled, set_disabled] = useState(true)
  return (
    <main>
      <h1>propiedad</h1>
      <section>
        <h2>ubicacion</h2>
        <Form method="POST">
          <input
            type="hidden"
            value={INTENT.UPDATE_LOCATION}
            name="intent"
          />
          <input
            type="hidden"
            value={property.location.id}
            name="id"
          />
          <LocationInput
            default_value={property.location.address}
            on_selection={() => {
              set_disabled(false)
            }}
            on_clear={() => {
              set_disabled(true)
            }}
          />
          <button disabled={disabled} type="submit">
            actualizar ubicacion
          </button>
          <a
            href={`https://www.google.com/maps?q=${property.location.latitude},${property.location.longitude}`}
            target="_blank"
          >
            View on Google Maps
          </a>
        </Form>
      </section>
      <section>
        <h2>habitaciones</h2>
        <ul>
          {property.rooms.map((room) => {
            const id = `room-${room.id}`
            return (
              <li key={id}>
                <Form method="POST">
                  <input
                    type="hidden"
                    value={room.id}
                    name="id"
                  />
                  <p>
                    <label htmlFor="length">length</label>
                    <input
                      id="length"
                      type="number"
                      name="length"
                      step={0.1}
                      defaultValue={room.length}
                    />
                  </p>
                  <p>
                    <label htmlFor="width">width</label>
                    <input
                      id="width"
                      type="number"
                      name="width"
                      defaultValue={room.width}
                    />
                  </p>
                  <button
                    type="submit"
                    name="intent"
                    value={INTENT.UPDATE_ROOM}
                  >
                    guardar cambios
                  </button>
                  <input type="hidden" />
                  <button
                    type="submit"
                    name="intent"
                    value={INTENT.DESTROY_ROOM}
                  >
                    eliminar habitacion
                  </button>
                </Form>
              </li>
            )
          })}
        </ul>
        <Form method="POST">
          <button
            type="submit"
            name="intent"
            value={INTENT.CREATE_ROOM}
          >
            add room
          </button>
        </Form>
      </section>
    </main>
  )
}

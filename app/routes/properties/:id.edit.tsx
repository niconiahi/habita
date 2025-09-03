import type { Route } from "./+types/:id"
import { Form } from "react-router"
import { fetch_property } from "./fetchers/server/property"
import { error } from "~/lib/server/error"
import * as v from "valibot"
import { query_builder } from "~/lib/server/query_builder"

const INTENT = {
  UPDATE_ROOM: "update_room",
  DESTROY_ROOM: "destroy_room",
} as const

export async function action({
  request,
}: Route.ActionArgs) {
  const form_data = await request.formData()
  const intent = form_data.get("intent")
  if (!intent) {
    throw error(400, "intent is required")
  }
  switch (intent) {
    case INTENT.UPDATE_ROOM: {
      const length = v.parse(
        v.pipe(v.string(), v.transform(Number)),
        form_data.get("length"),
      )
      const width = v.parse(
        v.pipe(v.string(), v.transform(Number)),
        form_data.get("width"),
      )
      const id = v.parse(
        v.pipe(v.string(), v.transform(Number)),
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
        v.pipe(v.string(), v.transform(Number)),
        form_data.get("id"),
      )
      await query_builder
        .deleteFrom("room")
        .where("room.id", "=", id)
        .execute()
      return null
    }
  }
  return null
}

export async function loader({ params }: Route.LoaderArgs) {
  params.id
  const property = await fetch_property(params.id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${params.id}`,
    )
  }
  return { property }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { property } = loaderData
  return (
    <main>
      <h1>property</h1>
      <section>
        <h2>rooms</h2>
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
      </section>
    </main>
  )
}

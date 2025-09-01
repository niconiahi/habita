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
      const id = v.parse(v.string(), form_data.get("id"))
      await query_builder
        .updateTable("room")
        .set({ width, length, updated_at: new Date() })
        .where("room.id", "=", id)
        .execute()
      return null
    }
    case INTENT.DESTROY_ROOM: {
      const id = v.parse(v.string(), form_data.get("id"))
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
                  <input
                    type="hidden"
                    value={INTENT.UPDATE_ROOM}
                    name="intent"
                  />
                  <p>
                    <label htmlFor={id}>length</label>
                    <input
                      id={id}
                      type="number"
                      name="length"
                      step={0.1}
                      defaultValue={room.length}
                    />
                  </p>
                  <p>
                    <label htmlFor={id}>width</label>
                    <input
                      id={id}
                      type="number"
                      name="width"
                      defaultValue={room.width}
                    />
                  </p>
                  <button type="submit">save room</button>
                  <Form method="POST">
                    <input
                      type="hidden"
                      value={room.id}
                      name="id"
                    />
                    <input
                      type="hidden"
                      value={INTENT.DESTROY_ROOM}
                      name="intent"
                    />
                    <button type="submit">
                      delete room
                    </button>
                  </Form>
                </Form>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}

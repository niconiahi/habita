import type { Route } from "./+types/:id"
import { Form } from "react-router"
import { fetch_property } from "./fetchers/property"

export async function action({
  request,
}: Route.ActionArgs) {
  const form_data = await request.formData()
  const lengths = form_data.get("length")
  console.log("lengths", lengths)
  const widths = form_data.get("width")
  console.log("widths", widths)
  const id = form_data.get("id")
  console.log("id", id)
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
                    <label htmlFor={id}>length</label>
                    <input
                      id={id}
                      type="number"
                      name="length"
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
                </Form>
              </li>
            )
          })}
        </ul>
      </section>
    </main>
  )
}

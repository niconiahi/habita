import type { Route } from "./+types/:id"
import { Link } from "react-router"
import { fetch_property } from "../fetchers/server/property"
import { ForceNumberSchema } from "~/lib/server/force_number"
import * as v from "valibot"

export async function action({ params }: Route.LoaderArgs) {
  const id = v.parse(ForceNumberSchema, params.id)
  const property = await fetch_property(id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${params.id}`,
    )
  }
  return { property }
}

export async function loader({ params }: Route.LoaderArgs) {
  const id = v.parse(ForceNumberSchema, params.id)
  const property = await fetch_property(id)
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
        la propiedad con identificador {property.id} la cual
        fue agregada el {property.created_at.toISOString()}
        <Link to="edit">Edit</Link>
      </section>
    </main>
  )
}

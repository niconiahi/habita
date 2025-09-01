import type { Route } from "./+types/:id"
import { Link } from "react-router"
import { fetch_property } from "./fetchers/server/property"

export async function action({ params }: Route.LoaderArgs) {
  params.id
  const property = await fetch_property(params.id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${params.id}`,
    )
  }
  console.log("property", JSON.stringify(property, null, 2))
  return { property }
}

export async function loader({ params }: Route.LoaderArgs) {
  params.id
  const property = await fetch_property(params.id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${params.id}`,
    )
  }
  console.log("property", JSON.stringify(property, null, 2))
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

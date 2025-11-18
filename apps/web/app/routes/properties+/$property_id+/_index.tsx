import { Link } from "react-router"
import * as v from "valibot"
import { ForceNumberSchema } from "~/lib/force_number.server"
import { fetch_property } from "../fetchers/server/property.server"
import type { Route } from "./+types/_index"

export async function action({ params }: Route.LoaderArgs) {
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const property = await fetch_property(property_id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${property_id}`,
    )
  }
  return { property }
}

export async function loader({ params }: Route.LoaderArgs) {
  const property_id = v.parse(
    ForceNumberSchema,
    params.property_id,
  )
  const property = await fetch_property(property_id)
  if (!property) {
    throw new Error(
      `property does not exist for id ${property_id}`,
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
        la propiedad ubicada en {property.location.road}{" "}
        {property.location.house_number}{" "}
        <Link to="book">Book</Link>
      </section>
    </main>
  )
}

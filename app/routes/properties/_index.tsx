import type { Route } from "./+types/_index"
import { Link } from "react-router"
import { fetch_properties } from "./fetchers/server/properties"

export async function loader() {
  const properties = await fetch_properties()
  return { properties }
}

export default function ({
  loaderData,
}: Route.ComponentProps) {
  const { properties } = loaderData
  return (
    <main>
      <h1>properties</h1>
      <ul>
        {properties.map((property) => {
          const key = `property-${property.id}`
          return (
            <li key={key}>
              la propiedad con identificador {property.id}{" "}
              la cual fue agregada el{" "}
              {property.created_at.toISOString()}
              <Link to={`${property.id}/edit`}>Edit</Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

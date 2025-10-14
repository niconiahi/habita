import { display_location } from "~/lib/display_address"
import type { Route } from "./+types/_index"
import { fetch_properties } from "./fetchers/server/properties"
import { Link } from "react-router"

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
              <Link to={`${property.id}`}>
                propiedad localizada en{" "}
                {display_location(property.location)}
              </Link>
            </li>
          )
        })}
      </ul>
    </main>
  )
}

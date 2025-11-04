import { display_location } from "~/lib/display_address"
import { get_img_props } from "~/lib/server/image.server"
import type { Route } from "./+types/_index"
import { fetch_properties } from "./fetchers/server/properties.server"
import { Link } from "react-router"

export async function loader() {
  const properties = await fetch_properties()

  // Generate image props on server
  const properties_with_img_props = properties.map((property) => {
    const first_image = property.images[0]
    const img_props = first_image
      ? get_img_props(first_image.id, first_image.hash, {
          widths: [400, 800],
          sizes: ["(max-width: 600px) 400px, (max-width: 900px) 800px"],
        })
      : null

    return {
      ...property,
      img_props,
    }
  })

  return { properties: properties_with_img_props }
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
                {property.img_props && (
                  <img
                    {...property.img_props}
                    alt={`Property at ${display_location(property.location)}`}
                  />
                )}
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

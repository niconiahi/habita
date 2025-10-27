import { display_location } from "~/lib/display_address"
import { get_img_props } from "~/lib/server/image"
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
          const first_image = property.images[0]
          return (
            <li key={key}>
              <Link to={`${property.id}`}>
                {first_image && (
                  <img
                    {...get_img_props(
                      first_image.id,
                      first_image.hash,
                      {
                        widths: [400, 800],
                        sizes: [
                          "(max-width: 600px) 400px, (max-width: 900px) 800px",
                        ],
                      },
                    )}
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

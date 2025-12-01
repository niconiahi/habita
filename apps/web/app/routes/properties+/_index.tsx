import { display_location } from "~/lib/display_location"
import { get_img_props } from "~/lib/image"
import type { Route } from "./+types/_index"
import { fetch_properties } from "./fetchers/server/properties.server"
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
              <div
                style={{
                  display: "flex",
                  overflowX: "auto",
                  scrollSnapType: "x mandatory",
                  WebkitOverflowScrolling: "touch",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                }}
              >
                {property.images.map((image) => {
                  const id = `img-${property.id}`
                  return (
                    <Link
                      key={id}
                      to={`${property.id}`}
                      style={{
                        aspectRatio: "4 / 3",
                        flex: "0 0 100%",
                        scrollSnapAlign: "start",
                        scrollSnapStop: "always",
                      }}
                    >
                      <img
                        {...get_img_props(
                          image.id,
                          image.hash,
                          {
                            widths: [400, 800],
                            sizes: [
                              "(max-width: 600px) 400px, (max-width: 900px) 800px",
                            ],
                          },
                        )}
                        alt={`Property at ${display_location(property.location)}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </Link>
                  )
                })}
              </div>
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

import { display_location } from "~/lib/display_location"
import { get_img_props } from "~/lib/image.server"
import type { Route } from "./+types/_index"
import { fetch_properties } from "./fetchers/properties.server"
import { Link } from "react-router"
import { Carousel } from "~/components/carousel"

export async function loader() {
  const properties = await fetch_properties()

  // Generate image props on the server
  const properties_with_image_props = properties.map(
    (property) => ({
      ...property,
      images: property.images.map((image, index) => ({
        ...image,
        props: get_img_props(image.id, image.hash, {
          widths: [400, 800],
          sizes: [
            "(max-width: 600px) 400px, (max-width: 900px) 800px",
          ],
        }),
        alt: `property at ${display_location(property.location)} - image ${index + 1}`,
      })),
    }),
  )

  return { properties: properties_with_image_props }
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
              <Carousel.Root
                label={`Property images at ${display_location(property.location)}`}
              >
                {property.images.map((image, index) => {
                  const id = `img-${property.id}-${index}`
                  return (
                    <Carousel.Slide key={id}>
                      <img
                        {...image.props}
                        alt={image.alt}
                      />
                    </Carousel.Slide>
                  )
                })}
              </Carousel.Root>
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

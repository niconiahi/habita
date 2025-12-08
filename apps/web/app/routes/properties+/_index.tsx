import { Link } from "react-router"
import { display_location } from "~/lib/display_location"
import { get_img_props } from "~/lib/image.server"
import { Card } from "~/components/card"
import { Button } from "~/components/button"
import { Content } from "~/components/content"
import { fetch_properties } from "./fetchers/properties.server"
import type { Route } from "./+types/_index"

export async function loader() {
  const properties = await fetch_properties()
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
    <Content.Root>
      <Content.Title>Propiedades</Content.Title>
      <Content.Section>
        <ul className="flex flex-col gap-4 w-1/2">
          {properties.map((property) => {
            const key = `property-${property.id}`
            const current_contract = property.contracts[0]
            const price = current_contract?.current_price
            const carousel_images = property.images.map(
              (image) => ({
                src: image.props.src,
                srcSet: image.props.srcSet,
                sizes: image.props.sizes,
                alt: image.alt,
              }),
            )
            return (
              <li key={key}>
                <Card.Root>
                  {carousel_images.length > 0 && (
                    <Card.Carousel
                      images={carousel_images}
                      label={`Imágenes de ${display_location(property.location)}`}
                    />
                  )}
                  <Card.Body>
                    <Card.Title>
                      {display_location(property.location)}
                    </Card.Title>
                    <Card.Actions>
                      <Card.Action>
                        <Link to={`${property.id}`}>
                          <Button>Ver</Button>
                        </Link>
                      </Card.Action>
                    </Card.Actions>
                    <Card.Content>
                      {price
                        ? `$${price.toLocaleString("es-AR")}/mes`
                        : "Consultar precio"}
                    </Card.Content>
                  </Card.Body>
                </Card.Root>
              </li>
            )
          })}
        </ul>
      </Content.Section>
    </Content.Root>
  )
}

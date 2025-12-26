<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Card from "$lib/components/Card"
  import Button from "$lib/components/Button.svelte"
  import { display_location } from "$lib/display_location"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Title>Propiedades</Content.Title>
  <Content.Section>
    <ul class="flex flex-col gap-4 w-1/2">
      {#each data.properties as property (property.id)}
        {@const contract = property.contracts[0]}
        {@const price = contract?.current_price}
        {@const images = property.images.map((image) => ({
          src: image.props.src,
          srcSet: image.props.srcSet,
          sizes: image.props.sizes,
          alt: image.alt,
        }))}
        <li>
          <Card.Root>
            <Card.Carousel
              {images}
              label={`Imagenes de ${display_location(property.location)}`}
            />
            <Card.Body>
              <Card.Title>
                {display_location(property.location)}
              </Card.Title>
              <Card.Actions>
                <Card.Action>
                  <a href={`/properties/${property.id}`}>
                    <Button>Ver</Button>
                  </a>
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
      {/each}
    </ul>
  </Content.Section>
</Content.Root>

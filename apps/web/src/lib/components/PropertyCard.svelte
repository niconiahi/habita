<script lang="ts">
  import Carousel from "$lib/components/Carousel/Root.svelte"
  import Button from "$lib/components/Button.svelte"

  interface CarouselImage {
    src: string
    srcSet?: string
    sizes?: string
    alt: string
  }

  interface Props {
    images: CarouselImage[]
    label: string
    price: number | null
    escalation: string | null
    location: string
    room_count: number
    total_surface: number
    bathroom_count: number
    href: string
  }

  let {
    images,
    label,
    price,
    escalation,
    location,
    room_count,
    total_surface,
    bathroom_count,
    href,
  }: Props = $props()
</script>

<article class="property-card">
  <div
    class="carousel-wrapper"
    style="--carousel-aspect-ratio: 1;"
  >
    <Carousel {images} {label} />
  </div>
  <div class="content">
    <div class="information">
      <div class="price">
        <span class="heading-sm price-amount">
          {price
            ? `$${price.toLocaleString("es-AR")}/mes`
            : "Consultar precio"}
        </span>
        {#if escalation}
          <span class="body-sm-regular escalation">
            ({escalation})
          </span>
        {/if}
      </div>
      <p class="body-md-medium location-text">{location}</p>
    </div>
    <div class="rooms body-md-regular">
      <span>{room_count} amb.</span>
      <span class="separator" aria-hidden="true"></span>
      <span>{total_surface} m² tot.</span>
      <span class="separator" aria-hidden="true"></span>
      <span>
        {bathroom_count}
        {bathroom_count === 1 ? "baño" : "baños"}
      </span>
    </div>
    <div class="actions">
      <a href={href}>
        <Button variant="primary">Ver detalle</Button>
      </a>
    </div>
  </div>
</article>

<style>
  .property-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    height: 100%;
    background-color: var(--card-bg-default);
    border-radius: var(--dimension-radius-lg);
    overflow: hidden;
  }

  .carousel-wrapper {
    width: 100%;
    flex-shrink: 0;
    overflow: hidden;
  }

  .content {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
    align-items: flex-start;
    padding: var(--dimension-spacing-3);
    background-color: var(--color-absolute-white);
    border-left: 1px solid var(--card-border);
    border-right: 1px solid var(--card-border);
    border-bottom: 1px solid var(--card-border);
    border-bottom-left-radius: var(--dimension-radius-lg);
    border-bottom-right-radius: var(--dimension-radius-lg);
    overflow: hidden;
    flex: 1;
  }

  .information {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
    align-items: flex-start;
    overflow: hidden;
    width: 100%;
  }

  .price {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
    align-items: flex-start;
    justify-content: center;
    width: 100%;
  }

  .price-amount {
    color: var(--card-fg-heading);
    width: 100%;
  }

  .escalation {
    color: var(--card-fg-body);
    width: 100%;
  }

  .location-text {
    color: var(--card-fg-heading);
    width: 100%;
  }

  .rooms {
    display: flex;
    gap: var(--dimension-spacing-2);
    align-items: flex-start;
    height: 22px;
    color: var(--card-fg-body);
    width: 100%;
    margin-top: auto;
  }

  .rooms span {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .separator {
    width: 1px;
    align-self: center;
    height: 100%;
    background-color: var(--card-fg-body);
  }

  .actions {
    display: flex;
    align-items: flex-start;
    width: 100%;
  }

  .actions a {
    text-decoration: none;
    flex: 1;
    min-height: 0;
    min-width: 0;
  }

  .actions a :global(button) {
    width: 100%;
  }
</style>

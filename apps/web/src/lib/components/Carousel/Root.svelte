<script lang="ts">
  interface CarouselImage {
    src: string
    srcSet?: string
    sizes?: string
    alt: string
  }

  interface Props {
    images: CarouselImage[]
    label: string
  }

  let { images, label }: Props = $props()

  let images_el: HTMLDivElement | undefined = $state()
  let current_index = $state(0)
  const images_count = $derived(images.length)

  function scroll_to_slide(index: number) {
    if (!images_el) return
    const item_width = images_el.clientWidth
    images_el.scrollTo({
      left: index * item_width,
      behavior: "smooth",
    })
  }

  function handle_scroll() {
    if (!images_el) return
    const scroll_left = images_el.scrollLeft
    const item_width = images_el.clientWidth
    const next_index = Math.round(scroll_left / item_width)
    current_index = next_index
  }
</script>

<section
  class="carousel"
  aria-roledescription="carousel"
  aria-label={label}
>
  <div
    class="images"
    bind:this={images_el}
    onscroll={handle_scroll}
    aria-live="polite"
    aria-atomic="false"
  >
    {#each images as image, index}
      {@const is_current = index === current_index}
      {@const slide_label = `slide ${index + 1} of ${images_count}`}
      <figure
        aria-roledescription="slide"
        aria-label={slide_label}
        aria-hidden={!is_current}
        inert={!is_current ? true : undefined}
      >
        <img
          src={image.src}
          srcset={image.srcSet}
          sizes={image.sizes}
          alt={image.alt}
          onerror={(event) => {
            const target = event.currentTarget as HTMLImageElement
            target.srcset = ""
            target.src = "/placeholder.svg"
          }}
        />
      </figure>
    {/each}
  </div>
  <div
    role="group"
    aria-label="Slide navigation"
    class="dots"
  >
    {#each images as _, index}
      {@const image_number = index + 1}
      <button
        type="button"
        class={index === current_index
          ? "dot active"
          : "dot"}
        aria-label={`Go to slide ${image_number} of ${images_count}`}
        aria-current={index === current_index
          ? "true"
          : undefined}
        onclick={() => scroll_to_slide(index)}
      ></button>
    {/each}
  </div>
</section>

<style>
  .carousel {
    position: relative;
  }

  .images {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .images::-webkit-scrollbar {
    display: none;
  }

  .images > figure {
    flex: 0 0 100%;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    aspect-ratio: 4 / 3;
    overflow: hidden;
    margin: 0;
  }

  .images img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  .dots {
    position: absolute;
    bottom: 12px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    list-style: none;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 16px;
  }

  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    transition: all 0.3s ease;
    border: none;
    padding: 0;
    cursor: pointer;
  }

  .dot.active {
    background: white;
    width: 24px;
    border-radius: 8px;
  }

  .dot:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }
</style>

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

  function handle_previous() {
    if (current_index > 0) {
      scroll_to_slide(current_index - 1)
    }
  }

  function handle_next() {
    if (current_index < images_count - 1) {
      scroll_to_slide(current_index + 1)
    }
  }

  let is_dragging = $state(false)
  let drag_start_x = 0
  let scroll_start = 0

  function handle_pointerdown(event: PointerEvent) {
    if (event.pointerType === "touch") return
    if (!images_el) return
    is_dragging = true
    drag_start_x = event.clientX
    scroll_start = images_el.scrollLeft
    images_el.setPointerCapture(event.pointerId)
  }

  function handle_pointermove(event: PointerEvent) {
    if (!is_dragging || !images_el) return
    const delta = event.clientX - drag_start_x
    images_el.scrollLeft = scroll_start - delta
  }

  function handle_pointerup(event: PointerEvent) {
    if (!is_dragging || !images_el) return
    is_dragging = false
    const delta = event.clientX - drag_start_x
    const threshold = images_el.clientWidth / 5
    let target_index = current_index
    if (delta < -threshold && current_index < images_count - 1) {
      target_index = current_index + 1
    } else if (delta > threshold && current_index > 0) {
      target_index = current_index - 1
    }
    current_index = target_index
    scroll_to_slide(current_index)
  }
</script>

<section
  class="carousel"
  aria-roledescription="carousel"
  aria-label={label}
>
  <div
    class="images"
    class:grabbing={is_dragging}
    role="region"
    bind:this={images_el}
    onscroll={handle_scroll}
    onpointerdown={handle_pointerdown}
    onpointermove={handle_pointermove}
    onpointerup={handle_pointerup}
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
            const target =
              event.currentTarget as HTMLImageElement
            target.srcset = ""
            target.src = "/placeholder.svg"
          }}
        />
      </figure>
    {/each}
  </div>
  {#if images_count > 1}
    <button
      type="button"
      class="arrow arrow-left"
      aria-label="Anterior"
      onclick={handle_previous}
      disabled={current_index === 0}
    >
      &#8249;
    </button>
    <button
      type="button"
      class="arrow arrow-right"
      aria-label="Siguiente"
      onclick={handle_next}
      disabled={current_index === images_count - 1}
    >
      &#8250;
    </button>
  {/if}
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
    width: 100%;
    height: 100%;
  }

  .images {
    display: flex;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    cursor: grab;
  }

  .images.grabbing {
    cursor: grabbing;
    scroll-snap-type: none;
  }

  .images::-webkit-scrollbar {
    display: none;
  }

  .images > figure {
    flex: 0 0 100%;
    scroll-snap-align: start;
    scroll-snap-stop: always;
    aspect-ratio: var(--carousel-aspect-ratio, 4 / 3);
    overflow: hidden;
    margin: 0;
  }

  .images img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }

  .arrow {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    width: var(--dimension-spacing-10);
    height: var(--dimension-spacing-10);
    border-radius: var(--dimension-radius-full);
    border: none;
    background-color: var(--button-secondary-bg-default);
    color: var(--button-secondary-fg-default);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    line-height: 1;
    padding: 0;
    z-index: 1;
  }

  .arrow:hover {
    background-color: var(--button-secondary-bg-hover);
  }

  .arrow:disabled {
    opacity: 0;
    pointer-events: none;
  }

  .arrow:focus-visible {
    outline: var(--focus-ring-width) solid
      var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  .arrow-left {
    left: var(--dimension-spacing-1);
  }

  .arrow-right {
    right: var(--dimension-spacing-2);
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
    outline: var(--focus-ring-width) solid
      var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }
</style>

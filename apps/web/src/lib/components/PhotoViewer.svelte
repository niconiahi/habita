<script module>
  export interface ViewerPhoto {
    src: string
    basename: string
    label?: string
    width?: string
    length?: string
  }

  export interface ViewerGroup {
    label: string
    photos: ViewerPhoto[]
  }
</script>

<script lang="ts">
  interface Props {
    groups?: ViewerGroup[]
    photos?: ViewerPhoto[]
    open?: (
      photo_index: number,
      group_index?: number,
    ) => void
  }

  let {
    groups,
    photos,
    open = $bindable(),
  }: Props = $props()

  let dialog_element: HTMLDialogElement | undefined =
    $state()
  let photo_element: HTMLDivElement | undefined = $state()
  let thumbnails_element: HTMLDivElement | undefined =
    $state()
  let current_group = $state(0)
  let current_photo = $state(0)

  const resolved_groups = $derived(
    groups ?? (photos ? [{ label: "", photos }] : []),
  )

  const has_group_picker = $derived(
    resolved_groups.length > 1,
  )

  const current_photos = $derived(
    resolved_groups[current_group]?.photos ?? [],
  )

  open = (photo_index: number, group_index?: number) => {
    current_group = group_index ?? 0
    current_photo = photo_index
    dialog_element?.showModal()
    is_open = true
    requestAnimationFrame(() => {
      photo_element?.focus()
    })
  }

  function close() {
    dialog_element?.close()
    is_open = false
  }

  function prev() {
    if (current_photo > 0) current_photo--
  }

  function next() {
    if (current_photo < current_photos.length - 1)
      current_photo++
  }

  function select_group(index: number) {
    current_group = index
    current_photo = 0
  }

  let is_open = $state(false)

  function handle_backdrop_click(event: MouseEvent) {
    if (
      event.target === dialog_element ||
      event.target === photo_element
    ) {
      close()
    }
  }

  function is_thumbnail_focused() {
    return (
      thumbnails_element?.contains(
        document.activeElement,
      ) ?? false
    )
  }

  function focus_active_thumbnail() {
    const active =
      thumbnails_element?.querySelector<HTMLElement>(
        ".viewer-thumbnail.active",
      )
    active?.focus()
  }

  function handle_keydown(event: KeyboardEvent) {
    if (!is_open) return
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      prev()
      if (is_thumbnail_focused()) {
        requestAnimationFrame(() =>
          focus_active_thumbnail(),
        )
      }
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      next()
      if (is_thumbnail_focused()) {
        requestAnimationFrame(() =>
          focus_active_thumbnail(),
        )
      }
    }
  }

  $effect(() => {
    window.addEventListener("keydown", handle_keydown)
    return () => {
      window.removeEventListener("keydown", handle_keydown)
    }
  })
</script>

<dialog
  bind:this={dialog_element}
  class="viewer"
  onclick={handle_backdrop_click}
>
  {#if has_group_picker}
    <div class="viewer-groups">
      {#each resolved_groups as group, index}
        <button
          type="button"
          class="viewer-group body-sm-bold"
          class:active={index === current_group}
          onclick={() => select_group(index)}
        >
          {group.label}
        </button>
      {/each}
    </div>
  {/if}

  <button
    type="button"
    class="viewer-close body-md-bold"
    onclick={close}
    aria-label="Cerrar"
  >
    &#x2715;
  </button>

  <button
    type="button"
    class="viewer-nav prev"
    onclick={prev}
    disabled={current_photo === 0}
    tabindex={current_photo === 0 ? -1 : 0}
    aria-label="Foto anterior"
  >
    &#x2039;
  </button>

  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    bind:this={photo_element}
    class="viewer-photo"
    tabindex="-1"
  >
    {#if current_photos[current_photo]}
      <div class="viewer-photo-inner">
        <img
          src={current_photos[current_photo].src}
          alt={current_photos[current_photo].basename}
        />
        {#if current_photos[current_photo].label}
          <div class="viewer-stats body-sm-bold">
            <span
              >{current_photos[current_photo].label}</span
            >
            {#if current_photos[current_photo].width && current_photos[current_photo].length}
              <span
                class="viewer-stats-dimensions body-sm-medium"
              >
                {current_photos[current_photo].width}m × {current_photos[
                  current_photo
                ].length}m
              </span>
            {/if}
          </div>
        {/if}
      </div>
    {:else}
      <p class="viewer-empty body-md-medium">
        No hay fotos en este piso
      </p>
    {/if}
  </div>

  <button
    type="button"
    class="viewer-nav next"
    onclick={next}
    disabled={current_photo >= current_photos.length - 1}
    tabindex={current_photo >= current_photos.length - 1
      ? -1
      : 0}
    aria-label="Foto siguiente"
  >
    &#x203A;
  </button>

  {#if current_photos.length > 1}
    <div
      bind:this={thumbnails_element}
      class="viewer-thumbnails"
      role="group"
      aria-label="Miniaturas"
    >
      {#each current_photos as photo, index}
        <button
          type="button"
          class="viewer-thumbnail"
          class:active={index === current_photo}
          tabindex={-1}
          onclick={() => (current_photo = index)}
        >
          <img src={photo.src} alt={photo.basename} />
        </button>
      {/each}
    </div>
  {/if}
</dialog>

<style>
  .viewer {
    border: none;
    padding: 0;
    margin: 0;
    background: rgba(0, 0, 0, 0.95);
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    overflow: hidden;
  }

  .viewer::backdrop {
    background-color: rgba(0, 0, 0, 0.95);
  }

  .viewer[open] {
    display: grid;
    grid-template-columns: auto 4rem 1fr 4rem;
    grid-template-rows: auto 1fr auto;
    gap: var(--dimension-spacing-4);
    padding: var(--dimension-spacing-4);
  }

  .viewer-groups {
    grid-column: 1;
    grid-row: 1 / -1;
    align-self: center;
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .viewer-group {
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-4);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: var(--dimension-radius-default);
    background: transparent;
    color: rgba(255, 255, 255, 0.5);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .viewer-group:hover {
    border-color: rgba(255, 255, 255, 0.4);
    color: rgba(255, 255, 255, 0.8);
  }

  .viewer-group.active {
    background-color: var(--color-blue-500);
    border-color: var(--color-blue-500);
    color: var(--color-absolute-white);
  }

  .viewer-close {
    grid-column: 4;
    grid-row: 1;
    justify-self: end;
    width: 3rem;
    height: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--dimension-radius-default);
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-absolute-white);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .viewer-close:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .viewer-nav {
    grid-row: 2;
    align-self: center;
    width: 4rem;
    height: 4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: var(--dimension-radius-lg);
    background: rgba(255, 255, 255, 0.1);
    color: var(--color-absolute-white);
    font-size: 2.5rem;
    line-height: 1;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .viewer-nav.prev {
    grid-column: 2;
  }

  .viewer-nav.next {
    grid-column: 4;
  }

  .viewer-nav:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  .viewer-nav:disabled {
    opacity: 0.2;
    cursor: default;
  }

  .viewer-photo {
    grid-column: 3;
    grid-row: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    outline: none;
  }

  .viewer-photo-inner {
    position: relative;
    display: flex;
    max-width: 100%;
    max-height: 100%;
  }

  .viewer-photo-inner img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: var(--dimension-radius-default);
  }

  .viewer-stats {
    position: absolute;
    top: var(--dimension-spacing-3);
    right: var(--dimension-spacing-3);
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: var(--dimension-spacing-1);
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-3);
    background: rgba(0, 0, 0, 0.7);
    color: var(--color-absolute-white);
    border-radius: var(--dimension-radius-default);
  }

  .viewer-stats-dimensions {
    color: rgba(255, 255, 255, 0.7);
  }

  .viewer-empty {
    color: rgba(255, 255, 255, 0.4);
  }

  .viewer-thumbnails {
    grid-column: 1 / -1;
    grid-row: 3;
    justify-self: center;
    display: flex;
    gap: var(--dimension-spacing-2);
    overflow-x: auto;
  }

  .viewer-thumbnail {
    flex-shrink: 0;
    width: 5rem;
    height: 3.5rem;
    padding: 0;
    border: 2px solid transparent;
    border-radius: var(--dimension-radius-default);
    background: transparent;
    cursor: pointer;
    opacity: 0.4;
    transition: all 0.15s ease;
    overflow: hidden;
  }

  .viewer-thumbnail:hover {
    opacity: 0.7;
  }

  .viewer-thumbnail.active {
    border-color: var(--color-blue-500);
    opacity: 1;
  }

  .viewer-thumbnail img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
</style>

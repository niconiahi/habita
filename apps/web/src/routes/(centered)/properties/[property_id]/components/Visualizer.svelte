<script lang="ts">
  import type { Snippet } from "svelte"
  import SegmentedButton from "$lib/components/SegmentedButton.svelte"
  import RoomMap from "$lib/components/RoomMap.svelte"

  interface Props {
    images: Snippet
    rooms: {
      id: number
      type: number
      width: string
      length: string
      position_x: string | null
      position_y: string | null
    }[]
  }

  let { images, rooms }: Props = $props()

  const VIEWS = [
    { label: "Map", value: "map" },
    { label: "Gallery", value: "gallery" },
  ]

  let selected_view = $state("gallery")
  let content_element: HTMLDivElement | undefined =
    $state()
  let is_panning = $state(false)
  let pan_start_x = 0
  let pan_start_y = 0
  let scroll_start_x = 0
  let scroll_start_y = 0

  function handle_pan_start(event: PointerEvent) {
    if (selected_view !== "map" || !content_element) return
    is_panning = true
    pan_start_x = event.clientX
    pan_start_y = event.clientY
    scroll_start_x = content_element.scrollLeft
    scroll_start_y = content_element.scrollTop
    content_element.setPointerCapture(event.pointerId)
  }

  function handle_pan_move(event: PointerEvent) {
    if (!is_panning || !content_element) return
    const delta_x = event.clientX - pan_start_x
    const delta_y = event.clientY - pan_start_y
    content_element.scrollLeft = scroll_start_x - delta_x
    content_element.scrollTop = scroll_start_y - delta_y
  }

  function handle_pan_end(event: PointerEvent) {
    if (!is_panning || !content_element) return
    is_panning = false
    content_element.releasePointerCapture(event.pointerId)
  }
</script>

<div class="visualizer">
  <div class="toggle">
    <SegmentedButton
      items={VIEWS}
      selected={selected_view}
      onchange={(value) => (selected_view = value)}
    />
  </div>
  <div
    class="content"
    class:map={selected_view === "map"}
    class:panning={is_panning}
    bind:this={content_element}
    onpointerdown={handle_pan_start}
    onpointermove={handle_pan_move}
    onpointerup={handle_pan_end}
    onpointercancel={handle_pan_end}
  >
    {#if selected_view === "map"}
      <RoomMap {rooms} is_readonly={true} />
    {:else}
      {@render images()}
    {/if}
  </div>
</div>

<style>
  .visualizer {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--dimension-spacing-4);
  }

  .content {
    width: 100%;
    height: 500px;
    overflow: auto;
    border-radius: var(--dimension-radius-lg);
  }

  .content.map {
    cursor: grab;
    scrollbar-width: none;
  }

  .content.map::-webkit-scrollbar {
    display: none;
  }

  .content.panning {
    cursor: grabbing;
    user-select: none;
  }
</style>

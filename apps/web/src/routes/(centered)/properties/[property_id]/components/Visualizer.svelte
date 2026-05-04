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
    clickable_room_ids?: Set<number>
    on_room_click?: (room_id: number) => void
  }

  let { images, rooms, clickable_room_ids, on_room_click }: Props = $props()

  const VIEWS = [
    { label: "Map", value: "map" },
    { label: "Gallery", value: "gallery" },
  ]

  let selected_view = $state("gallery")
</script>

<div class="visualizer">
  <div class="toggle">
    <SegmentedButton
      items={VIEWS}
      selected={selected_view}
      onchange={(value) => (selected_view = value)}
    />
  </div>
  <div class="content">
    {#if selected_view === "map"}
      <RoomMap {rooms} is_readonly={true} {clickable_room_ids} {on_room_click} />
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
    scrollbar-width: none;
  }

  .content::-webkit-scrollbar {
    display: none;
  }
</style>

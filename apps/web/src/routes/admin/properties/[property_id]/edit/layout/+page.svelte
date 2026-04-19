<script lang="ts">
  import { page } from "$app/state"
  import { goto, invalidateAll } from "$app/navigation"
  import { enhance } from "$app/forms"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import SegmentedButton from "$lib/components/SegmentedButton.svelte"
  import RoomMap from "$lib/components/RoomMap.svelte"
  import { display_floor_number } from "$lib/floor_number"
  import {
    display_room_type,
    ROOM_TYPE,
  } from "$lib/room_type"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "../actions/action"
  import type { PageData } from "./$types"

  const LAYOUT_VIEW = {
    DIMENSIONES: "dimensiones",
    MAPA: "mapa",
  } as const

  let { data }: { data: PageData } = $props()

  let layout_view: string = $state(
    LAYOUT_VIEW.DIMENSIONES,
  )
  let room_positions = $state<
    Map<number, { x: number; y: number }>
  >(new Map())

  const selected_floor_number = $derived(() => {
    const param = page.url.searchParams.get("floor")
    if (param !== null) return Number(param)
    return data.property.floors[0]?.number ?? 0
  })

  const selected_floor = $derived(
    data.property.floors.find(
      (f) => f.number === selected_floor_number(),
    ),
  )

  function select_floor(floor_number: number) {
    const url = new URL(page.url)
    url.searchParams.set("floor", String(floor_number))
    goto(url, { replaceState: true, noScroll: true })
  }

  function handle_positions_change(
    positions: Map<number, { x: number; y: number }>,
  ) {
    room_positions = positions
  }

  // Floor drag-to-reorder
  let dragging_floor_id = $state<number | null>(null)
  let drag_over_floor_id = $state<number | null>(null)
  let drag_translate_y = $state(0)
  let pending_floor_number = $state<number | null>(null)
  let drag_start_y = $state(0)

  function handle_floor_pointer_down(
    event: PointerEvent,
    floor_id: number,
  ) {
    const target = event.currentTarget as HTMLElement
    target.setPointerCapture(event.pointerId)
    dragging_floor_id = floor_id
    drag_start_y = event.clientY
    drag_translate_y = 0
  }

  function handle_floor_pointer_move(
    event: PointerEvent,
  ) {
    if (dragging_floor_id === null) return
    drag_translate_y = event.clientY - drag_start_y

    // Find which floor button the pointer is over
    const buttons = document.querySelectorAll(
      "[data-floor-id]",
    )
    for (const button of buttons) {
      const id = Number(
        (button as HTMLElement).dataset.floorId,
      )
      if (id === dragging_floor_id) continue
      const rect = button.getBoundingClientRect()
      if (
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        drag_over_floor_id = id
        break
      }
    }
  }

  function handle_floor_pointer_up(
    event: PointerEvent,
  ) {
    const dragged_id = dragging_floor_id
    const over_id = drag_over_floor_id

    dragging_floor_id = null
    drag_over_floor_id = null
    drag_translate_y = 0

    if (
      dragged_id === null ||
      over_id === null ||
      dragged_id === over_id
    ) {
      return
    }

    const floors = [...data.property.floors]
    const from_index = floors.findIndex(
      (f) => f.id === dragged_id,
    )
    const to_index = floors.findIndex(
      (f) => f.id === over_id,
    )

    if (from_index !== -1 && to_index !== -1) {
      // The dragged floor takes the target floor's number
      const target_number = floors[to_index].number
      const [moved] = floors.splice(from_index, 1)
      floors.splice(to_index, 0, moved)

      pending_floor_number = target_number

      const form = document.getElementById(
        "reorder-floors-form",
      ) as HTMLFormElement
      const input = form.querySelector(
        'input[name="floor_ids"]',
      ) as HTMLInputElement
      input.value = JSON.stringify(
        floors.map((f) => f.id),
      )
      form.requestSubmit()
    }
  }
</script>

<section class="layout">
  <div class="floor-picker">
    <form
      method="POST"
      action={compose_action(ACTION.CREATE_FLOOR)}
      use:enhance
    >
      <input type="hidden" name="direction" value="up" />
      <button
        type="submit"
        class="add-floor-button body-sm-medium"
      >
        agregar +
      </button>
    </form>
    <div class="floor-list">
      {#each [...data.property.floors].reverse() as floor (floor.id)}
        <button
          type="button"
          class="floor-button body-md-bold"
          class:active={floor.number === selected_floor_number()}
          class:dragging={floor.id === dragging_floor_id}
          class:drag-over={floor.id === drag_over_floor_id &&
            dragging_floor_id !== null}
          data-floor-id={floor.id}
          style:transform={floor.id === dragging_floor_id
            ? `translateY(${drag_translate_y}px)`
            : undefined}
          onclick={() => select_floor(floor.number)}
          onpointerdown={(e) =>
            handle_floor_pointer_down(e, floor.id)}
          onpointermove={handle_floor_pointer_move}
          onpointerup={handle_floor_pointer_up}
          onpointercancel={handle_floor_pointer_up}
        >
          {display_floor_number(floor.number)}
        </button>
      {/each}
    </div>
    <form
      method="POST"
      action={compose_action(ACTION.CREATE_FLOOR)}
      use:enhance
    >
      <input type="hidden" name="direction" value="down" />
      <button
        type="submit"
        class="add-floor-button body-sm-medium"
      >
        agregar +
      </button>
    </form>
  </div>

  <div class="floor-content">
    <div class="content-header">
      <h2 class="heading-sm content-title">Disposición</h2>
    </div>
    <SegmentedButton
      items={[
        {
          label: "Dimensiones",
          value: LAYOUT_VIEW.DIMENSIONES,
        },
        {
          label: "Mapa",
          value: LAYOUT_VIEW.MAPA,
        },
      ]}
      selected={layout_view}
      onchange={(value) => (layout_view = value)}
    />

    {#if selected_floor}
      {#if layout_view === LAYOUT_VIEW.DIMENSIONES}
        <ul class="room-list">
          {#each selected_floor.rooms as room (room.id)}
            <li class="room-card">
              <Formulary.Root method="POST">
                <Formulary.Fields>
                  <input
                    type="hidden"
                    value={room.id}
                    name="id"
                  />
                  <Formulary.Field>
                    <Formulary.Label
                      for={`type_${room.id}`}
                      >tipo</Formulary.Label
                    >
                    <Formulary.Select
                      name="type"
                      id={`type_${room.id}`}
                      value={room.type}
                    >
                      {#each Object.values(ROOM_TYPE) as type}
                        <option value={type}
                          >{display_room_type(
                            type,
                          )}</option
                        >
                      {/each}
                    </Formulary.Select>
                  </Formulary.Field>
                  <Formulary.Field>
                    <Formulary.Label
                      for={`width_${room.id}`}
                      >ancho</Formulary.Label
                    >
                    <input
                      id={`width_${room.id}`}
                      type="number"
                      name="width"
                      value={room.width}
                    />
                  </Formulary.Field>
                  <Formulary.Field>
                    <Formulary.Label
                      for={`length_${room.id}`}
                      >largo</Formulary.Label
                    >
                    <input
                      id={`length_${room.id}`}
                      type="number"
                      name="length"
                      step="0.1"
                      value={room.length}
                    />
                  </Formulary.Field>
                </Formulary.Fields>
                <Formulary.Actions>
                  <Button
                    variant="primary"
                    type="submit"
                    formaction={compose_action(
                      ACTION.UPDATE_ROOM,
                    )}>Guardar habitación</Button
                  >
                  <Button
                    variant="secondary"
                    type="submit"
                    formaction={compose_action(
                      ACTION.DESTROY_ROOM,
                    )}>Eliminar habitación</Button
                  >
                </Formulary.Actions>
              </Formulary.Root>
            </li>
          {/each}
        </ul>
        <div class="add-room">
          <form
            method="POST"
            action={compose_action(ACTION.CREATE_ROOM)}
            use:enhance
          >
            <input
              type="hidden"
              name="floor_id"
              value={selected_floor.id}
            />
            <button
              type="submit"
              class="add-room-button body-sm-medium"
            >
              agregar habitación +
            </button>
          </form>
        </div>
      {:else if selected_floor.rooms.length > 0}
        <Formulary.Root
          method="POST"
          action={compose_action(
            ACTION.UPDATE_ROOM_POSITIONS,
          )}
        >
          <Formulary.Fields>
            <input
              type="hidden"
              name="positions"
              value={JSON.stringify(
                selected_floor.rooms
                  .filter((room) => {
                    const pos = room_positions.get(
                      room.id,
                    )
                    return pos !== undefined
                  })
                  .map((room) => {
                    const pos = room_positions.get(
                      room.id,
                    )!
                    return {
                      room_id: room.id,
                      position_x: pos.x,
                      position_y: pos.y,
                    }
                  }),
              )}
            />
            <RoomMap
              rooms={selected_floor.rooms}
              on_positions_change={handle_positions_change}
            />
          </Formulary.Fields>
          <Formulary.Actions>
            <Button
              variant="primary"
              type="submit"
              disabled={room_positions.size === 0}
              >Guardar mapa</Button
            >
          </Formulary.Actions>
        </Formulary.Root>
      {/if}
    {:else}
      <p class="body-md-medium empty">
        Seleccioná un piso para ver sus habitaciones
      </p>
    {/if}
  </div>
</section>

<!-- Hidden form for floor reordering -->
<form
  id="reorder-floors-form"
  method="POST"
  action={compose_action(ACTION.REORDER_FLOORS)}
  use:enhance={() => {
    return async ({ result }) => {
      if (result.type === "success" && pending_floor_number !== null) {
        await invalidateAll()
        await goto(`?floor=${pending_floor_number}`, {
          replaceState: true,
          noScroll: true,
        })
        pending_floor_number = null
      }
    }
  }}
  hidden
>
  <input type="hidden" name="floor_ids" value="" />
</form>

<style>
  .layout {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--dimension-spacing-6);
  }

  .floor-picker {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .floor-list {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
  }

  .floor-button {
    position: relative;
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-4);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-default);
    background: var(--color-absolute-white);
    cursor: grab;
    text-align: center;
    transition:
      background-color 0.15s ease,
      box-shadow 0.15s ease,
      transform 0.15s ease;
    touch-action: none;
    user-select: none;
  }

  .floor-button:hover {
    background-color: var(--color-neutrals-50);
  }

  .floor-button.active {
    background-color: var(--color-blue-500);
    color: var(--color-absolute-white);
    border-color: var(--color-blue-500);
  }

  .floor-button.dragging {
    z-index: 10;
    cursor: grabbing;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    opacity: 0.9;
    transition: none;
  }

  .floor-button.drag-over {
    border-color: var(--color-blue-300);
    border-style: dashed;
  }

  .add-floor-button {
    width: 100%;
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-4);
    border: 1px dashed var(--color-border-primary);
    border-radius: var(--dimension-radius-default);
    background: transparent;
    color: var(--color-neutrals-400);
    cursor: pointer;
    text-align: center;
    transition: all 0.15s ease;
  }

  .add-floor-button:hover {
    border-color: var(--color-blue-300);
    color: var(--color-blue-500);
  }

  .floor-content {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .content-title {
    color: var(--color-text-heading);
  }

  .room-list {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .room-card {
    padding: var(--dimension-spacing-4);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
  }

  .add-room {
    display: flex;
    justify-content: flex-end;
  }

  .add-room-button {
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-4);
    border: 1px dashed var(--color-border-primary);
    border-radius: var(--dimension-radius-default);
    background: transparent;
    color: var(--color-neutrals-400);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .add-room-button:hover {
    border-color: var(--color-blue-300);
    color: var(--color-blue-500);
  }

  .empty {
    padding: var(--dimension-spacing-6);
    color: var(--color-text-body);
    text-align: center;
  }
</style>

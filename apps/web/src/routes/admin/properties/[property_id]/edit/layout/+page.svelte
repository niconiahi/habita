<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import SegmentedButton from "$lib/components/SegmentedButton.svelte"
  import RoomMap from "$lib/components/RoomMap.svelte"
  import {
    display_floor_number,
    get_floor_numbers,
    FLOOR_NUMBER,
  } from "$lib/floor_number"
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

  function handle_positions_change(
    positions: Map<number, { x: number; y: number }>,
  ) {
    room_positions = positions
  }
</script>

<section>
  <div class="tab-header">
    <h2 class="heading-sm tab-title">Disposición</h2>
    <form
      method="POST"
      action={compose_action(ACTION.CREATE_FLOOR)}
      use:enhance
    >
      <Button variant="secondary" type="submit">Agregar piso</Button>
    </form>
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
  {#each data.property.floors as floor (floor.id)}
    <div class="floor-section">
      <Formulary.Root method="POST">
        <Formulary.Fields>
          <input
            type="hidden"
            value={floor.id}
            name="id"
          />
          <Formulary.Field>
            <Formulary.Label
              for={`floor_number_${floor.id}`}
              >piso</Formulary.Label
            >
            <Formulary.Select
              name="number"
              id={`floor_number_${floor.id}`}
              value={floor.number}
            >
              {#each get_floor_numbers() as number}
                <option value={number}
                  >{display_floor_number(number)}</option
                >
              {/each}
            </Formulary.Select>
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            variant="primary"
            type="submit"
            formaction={compose_action(
              ACTION.UPDATE_FLOOR,
            )}>Guardar piso</Button
          >
          {#if floor.number !== FLOOR_NUMBER.GROUND}
            <Button
              variant="secondary"
              type="submit"
              formaction={compose_action(
                ACTION.DESTROY_FLOOR,
              )}>Eliminar piso</Button
            >
          {/if}
        </Formulary.Actions>
      </Formulary.Root>
      {#if layout_view === LAYOUT_VIEW.DIMENSIONES}
        <div class="tab-header">
          <h3 class="body-md-bold tab-title">
            {display_floor_number(floor.number)}
          </h3>
          <form
            method="POST"
            action={compose_action(ACTION.CREATE_ROOM)}
            use:enhance
          >
            <input
              type="hidden"
              name="floor_id"
              value={floor.id}
            />
            <Button variant="secondary" type="submit"
              >Agregar habitación</Button
            >
          </form>
        </div>
        <ul>
          {#each floor.rooms as room (room.id)}
            <li>
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
      {:else if floor.rooms.length > 0}
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
                floor.rooms
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
              rooms={floor.rooms}
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
    </div>
  {/each}
</section>

<style>
  .tab-title {
    color: var(--color-text-heading);
  }

  .tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .floor-section {
    border: 1px solid rgb(55 65 81);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
</style>

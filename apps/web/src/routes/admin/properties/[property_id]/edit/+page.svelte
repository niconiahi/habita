<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import LocationInput from "$lib/components/LocationInput.svelte"
  import RoomMap from "$lib/components/RoomMap.svelte"
  import { has_action_error } from "$lib/has_action_error"
  import {
    get_access_label,
    ACCESS_TYPE,
  } from "$lib/access_type"
  import { display_name } from "$lib/display_name"
  import {
    get_property_destinies,
    get_property_destiny_label,
  } from "$lib/property_destiny"
  import {
    display_floor_number,
    get_floor_numbers,
    FLOOR_NUMBER,
  } from "$lib/floor_number"
  import {
    display_room_type,
    ROOM_TYPE,
  } from "$lib/room_type"
  import {
    get_service_type_label,
    SERVICE_TYPE,
  } from "$lib/service"
  import {
    PROPERTY_TAG_CATEGORIES,
    get_property_tag_type_label,
  } from "$lib/property_tag_type"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData, ActionData } from "./$types"
  let { data, form }: { data: PageData; form: ActionData } =
    $props()
  let file_input: HTMLInputElement | undefined = $state()
  let photo_form: HTMLFormElement | undefined = $state()
  let room_positions = $state<
    Map<number, { x: number; y: number }>
  >(new Map())
  const property_destinies = get_property_destinies()
  const active_tag_types = $derived(
    new Set(data.property.tags.map((t) => t.type)),
  )
  const has_landlord = $derived(
    data.property.members.some(
      (member) => member.type === ACCESS_TYPE.LANDLORD,
    ),
  )
  const all_services_added = $derived(
    data.property.services.length ===
      Object.keys(SERVICE_TYPE).length,
  )
  const used_service_types = $derived(
    new Set(data.property.services.map((s) => s.type)),
  )
  function handle_add_photo_click() {
    file_input?.click()
  }
  function handle_photo_change() {
    photo_form?.requestSubmit()
  }
  function handle_positions_change(
    positions: Map<number, { x: number; y: number }>,
  ) {
    room_positions = positions
  }
</script>

{#snippet Location()}
  <Content.Section>
    <Section.Header>
      <Section.Title>ubicación</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_LOCATION)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.property.location.id}
          name="id"
        />
        <LocationInput
          default_value={data.property.location.address}
          default_lon={String(
            data.property.location.longitude,
          )}
          default_lat={String(
            data.property.location.latitude,
          )}
        />
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar ubicación</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet Destinies()}
  <Content.Section>
    <Section.Header>
      <Section.Title>destino</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_DESTINIES)}
    >
      <Formulary.Fields>
        <Formulary.Field>
          <Formulary.Label>tipos</Formulary.Label>
          <fieldset class="checkbox-list">
            {#each property_destinies as destiny}
              {@const is_checked =
                data.property.destinies.includes(destiny)}
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  name="destiny"
                  value={destiny}
                  checked={is_checked}
                />
                {get_property_destiny_label(destiny)}
              </label>
            {/each}
          </fieldset>
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar destino</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet Floors()}
  <Content.Section>
    <Section.Header>
      <Section.Title>pisos</Section.Title>
      <Section.Actions>
        <form
          method="POST"
          action={compose_action(ACTION.CREATE_FLOOR)}
          use:enhance
        >
          <Button type="submit">Agregar piso</Button>
        </form>
      </Section.Actions>
    </Section.Header>
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
                    >{display_floor_number(
                      number,
                    )}</option
                  >
                {/each}
              </Formulary.Select>
            </Formulary.Field>
          </Formulary.Fields>
          <Formulary.Actions>
            <Button
              type="submit"
              formaction={compose_action(
                ACTION.UPDATE_FLOOR,
              )}>Guardar piso</Button
            >
            {#if floor.number !== FLOOR_NUMBER.GROUND}
              <Button
                type="submit"
                formaction={compose_action(
                  ACTION.DESTROY_FLOOR,
                )}>Eliminar piso</Button
              >
            {/if}
          </Formulary.Actions>
        </Formulary.Root>
        <Section.Header>
          <Section.Title
            >{display_floor_number(
              floor.number,
            )}</Section.Title
          >
          <Section.Actions>
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
              <Button type="submit"
                >Agregar ambiente</Button
              >
            </form>
          </Section.Actions>
        </Section.Header>
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
                    <Formulary.Label for={`type_${room.id}`}
                      >tipo</Formulary.Label
                    >
                    <Formulary.Select
                      name="type"
                      id={`type_${room.id}`}
                      value={room.type}
                    >
                      {#each Object.values(ROOM_TYPE) as type}
                        <option value={type}
                          >{display_room_type(type)}</option
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
                    type="submit"
                    formaction={compose_action(
                      ACTION.UPDATE_ROOM,
                    )}>Guardar ambiente</Button
                  >
                  <Button
                    type="submit"
                    formaction={compose_action(
                      ACTION.DESTROY_ROOM,
                    )}>Eliminar ambiente</Button
                  >
                </Formulary.Actions>
              </Formulary.Root>
            </li>
          {/each}
        </ul>
        {#if floor.rooms.length > 0}
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
                type="submit"
                disabled={room_positions.size === 0}
                >Guardar mapa</Button
              >
            </Formulary.Actions>
          </Formulary.Root>
        {/if}
      </div>
    {/each}
  </Content.Section>
{/snippet}

{#snippet Members()}
  <Content.Section id="members">
    <Section.Header>
      <Section.Title>miembros</Section.Title>
    </Section.Header>
    <ul class="member-list">
      {#each data.property.members as member, index (`member-${member.id}-${index}`)}
        <li class="member-item">
          <input
            type="hidden"
            value={member.id}
            name="id"
          />
          <p>{display_name(member)}</p>
          <p>{get_access_label(member.type)}</p>
        </li>
      {/each}
    </ul>
    {#if !has_landlord}
      <Formulary.Root
        method="POST"
        action={compose_action(ACTION.INVITE_LANDLORD)}
      >
        <Formulary.Fields>
          <Formulary.Field>
            <Formulary.Label for="email"
              >email</Formulary.Label
            >
            <input id="email" name="email" type="email" />
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button type="submit">Invitar dueño</Button>
        </Formulary.Actions>
      </Formulary.Root>
    {/if}
  </Content.Section>
{/snippet}

{#snippet Photos()}
  <Content.Section>
    <Section.Header>
      <Section.Title>fotos</Section.Title>
      <Section.Actions>
        <Button
          type="button"
          onclick={handle_add_photo_click}
          >Agregar foto</Button
        >
      </Section.Actions>
    </Section.Header>
    <ul class="photo-grid">
      {#each data.property.images as image (`image_${image.id}`)}
        <li>
          <img
            class="photo"
            alt="Foto de la propiedad"
            src={`/files/${image.id}`}
          />
        </li>
      {/each}
    </ul>
    <form
      bind:this={photo_form}
      method="POST"
      action={compose_action(ACTION.CREATE_PROPERTY_FILE)}
      enctype="multipart/form-data"
      class="hidden-form"
      onchange={handle_photo_change}
      use:enhance
    >
      <input
        bind:this={file_input}
        type="file"
        name="file"
        class="sr-only"
      />
    </form>
  </Content.Section>
{/snippet}

{#snippet Services()}
  <Content.Section>
    <Section.Header>
      <Section.Title>servicios</Section.Title>
      <Section.Actions>
        <form
          method="POST"
          action={compose_action(ACTION.CREATE_SERVICE)}
          use:enhance
        >
          <Button
            type="submit"
            disabled={all_services_added}
            >Agregar servicio</Button
          >
        </form>
      </Section.Actions>
    </Section.Header>
    <ul>
      {#each data.property.services as service (`service_${service.id}`)}
        <li>
          <Formulary.Root method="POST">
            <Formulary.Fields>
              <input
                type="hidden"
                value={service.id}
                name="id"
              />
              <Formulary.Field>
                <Formulary.Label for={`type_${service.id}`}
                  >tipo</Formulary.Label
                >
                <Formulary.Select
                  name="type"
                  id={`type_${service.id}`}
                  value={service.type}
                >
                  {#each Object.values(SERVICE_TYPE) as type}
                    {#if type === service.type || !used_service_types.has(type)}
                      <option value={type}
                        >{get_service_type_label(
                          type,
                        )}</option
                      >
                    {/if}
                  {/each}
                </Formulary.Select>
              </Formulary.Field>
              <Formulary.Field>
                <Formulary.Label for={`code_${service.id}`}
                  >identificador</Formulary.Label
                >
                <input
                  id={`code_${service.id}`}
                  type="number"
                  name="code"
                  value={service.code}
                />
              </Formulary.Field>
            </Formulary.Fields>
            <Formulary.Actions>
              <Button
                type="submit"
                formaction={compose_action(
                  ACTION.UPDATE_SERVICE,
                )}>Guardar servicio</Button
              >
              <Button
                type="submit"
                formaction={compose_action(
                  ACTION.DESTROY_SERVICE,
                )}>Eliminar servicio</Button
              >
            </Formulary.Actions>
          </Formulary.Root>
        </li>
      {/each}
    </ul>
    {#if has_action_error(form, "update_service")}
      <p class="error">{form.errors.update_service}</p>
    {/if}
  </Content.Section>
{/snippet}

{#snippet Tags()}
  <Content.Section>
    <Section.Header>
      <Section.Title>tags</Section.Title>
    </Section.Header>
    {#each PROPERTY_TAG_CATEGORIES as category}
      <fieldset class="tag-category">
        <legend>{category.label}</legend>
        <div class="checkbox-list">
          {#each category.tags as tag_type}
            {@const is_checked =
              active_tag_types.has(tag_type)}
            <form
              method="POST"
              action={compose_action(ACTION.TOGGLE_TAG)}
              use:enhance
            >
              <input
                type="hidden"
                name="type"
                value={tag_type}
              />
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={is_checked}
                  onchange={(e) =>
                    e.currentTarget.form?.requestSubmit()}
                />
                {get_property_tag_type_label(tag_type)}
              </label>
            </form>
          {/each}
        </div>
      </fieldset>
    {/each}
  </Content.Section>
{/snippet}

{#snippet Building()}
  <Content.Section>
    <Section.Header>
      <Section.Title>edificio</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(
        ACTION.UPDATE_CONSTRUCTION_YEAR,
      )}
    >
      <Formulary.Fields>
        <Formulary.Field>
          <Formulary.Label for="construction_year"
            >año de construcción</Formulary.Label
          >
          <input
            id="construction_year"
            type="number"
            name="construction_year"
            min={1900}
            max={2026}
            placeholder="2015"
            value={data.property.construction_year ?? ""}
          />
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar año</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

<Content.Root>
  <Content.Title>Edición de propiedad</Content.Title>
  {@render Location()}
  {@render Destinies()}
  {@render Tags()}
  {@render Building()}
  {@render Floors()}
  {@render Members()}
  {@render Photos()}
  {@render Services()}
</Content.Root>

<style>
  .checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .member-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }
  .member-item {
    display: flex;
    gap: 1rem;
  }
  .photo-grid {
    display: grid;
    grid-template-columns: repeat(1, minmax(0, 1fr));
    gap: 1rem;
    list-style: none;
    padding: 0;
    margin: 0;
  }
  @media (min-width: 800px) {
    .photo-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (min-width: 1200px) {
    .photo-grid {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  .photo {
    width: 100%;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
  }
  .hidden-form {
    display: contents;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  .tag-category {
    border: none;
    padding: 0;
    margin: 0 0 1rem;
  }
  .tag-category legend {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
  .floor-section {
    border: 1px solid rgb(55 65 81);
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
  }
  .error {
    color: rgb(239 68 68);
  }
</style>

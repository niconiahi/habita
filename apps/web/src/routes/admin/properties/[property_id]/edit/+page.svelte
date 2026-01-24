<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import LocationInput from "$lib/components/LocationInput.svelte"
  import RoomMap from "$lib/components/RoomMap.svelte"
  import { get_role_label } from "$lib/organization_role"
  import { display_name } from "$lib/display_name"
  import {
    get_property_destinies,
    get_property_destiny_label,
  } from "$lib/property_destiny"
  import {
    display_room_type,
    ROOM_TYPE,
  } from "$lib/room_type"
  import {
    get_service_type_label,
    SERVICE_TYPE,
  } from "$lib/service"
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
  const has_landlord = $derived(
    data.property.members.some(
      (member) => member.role === "landlord",
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
          <Formulary.Label for="destiny"
            >tipos</Formulary.Label
          >
          <fieldset class="flex flex-col gap-2">
            {#each property_destinies as destiny}
              {@const is_checked =
                data.property.destinies.includes(destiny)}
              <label class="flex items-center gap-2">
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

{#snippet Rooms()}
  <Content.Section>
    <Section.Header>
      <Section.Title>ambientes</Section.Title>
      <Section.Actions>
        <form
          method="POST"
          action={compose_action(ACTION.CREATE_ROOM)}
          use:enhance
        >
          <Button type="submit">Agregar ambiente</Button>
        </form>
      </Section.Actions>
    </Section.Header>
    <ul>
      {#each data.property.rooms as room (room.id)}
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
                <Formulary.Label for={`length_${room.id}`}
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
                <Formulary.Label for={`width_${room.id}`}
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
  </Content.Section>
{/snippet}

{#snippet RoomMapSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>mapa</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_ROOM_POSITIONS)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          name="positions"
          value={JSON.stringify(
            Array.from(room_positions.entries()).map(
              ([room_id, pos]) => ({
                room_id,
                position_x: pos.x,
                position_y: pos.y,
              }),
            ),
          )}
        />
        <RoomMap
          rooms={data.property.rooms}
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
  </Content.Section>
{/snippet}

{#snippet Members()}
  <Content.Section id="members">
    <Section.Header>
      <Section.Title>miembros</Section.Title>
    </Section.Header>
    <ul class="flex flex-col gap-4 mb-4">
      {#each data.property.members as member, index (`member-${member.id}-${index}`)}
        <li class="flex gap-4">
          <input
            type="hidden"
            value={member.id}
            name="id"
          />
          <p>{display_name(member)}</p>
          <p>{get_role_label(member.role)}</p>
        </li>
      {/each}
    </ul>
    {#if !has_landlord}
      <Formulary.Root
        method="POST"
        action={compose_action(ACTION.INVITE_OWNER)}
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
    <ul
      class="!grid grid-cols-1 min-[800px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-4 list-none p-0 m-0"
    >
      {#each data.property.images as image (`image_${image.id}`)}
        <li>
          <img
            class="w-full aspect-video object-cover block"
            alt="Foto de la propiedad"
            src={`data:image/webp;base64,${image.content}`}
          />
        </li>
      {/each}
    </ul>
    <form
      bind:this={photo_form}
      method="POST"
      action={compose_action(ACTION.CREATE_PROPERTY_FILE)}
      enctype="multipart/form-data"
      class="contents"
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
    {#if form?.error}
      <p class="text-red-500">{form.error}</p>
    {/if}
  </Content.Section>
{/snippet}

<Content.Root>
  <Content.Title>Edición de propiedad</Content.Title>
  {@render Location()}
  {@render Destinies()}
  {@render Rooms()}
  {@render RoomMapSection()}
  {@render Members()}
  {@render Photos()}
  {@render Services()}
</Content.Root>

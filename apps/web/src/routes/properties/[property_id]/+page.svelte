<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import Button from "$lib/components/Button.svelte"
  import RoomMap from "$lib/components/RoomMap.svelte"
  import { get_property_destiny_label } from "$lib/property_destiny"
  import { display_room_type } from "$lib/room_type"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

{#snippet InfoRow(label: string, detail?: string)}
  <li
    class="flex items-center gap-4 p-3 border-2 border-gray-700 rounded"
  >
    <span class="font-medium text-gray-50">{label}</span>
    {#if detail}
      <span class="text-gray-300">{detail}</span>
    {/if}
  </li>
{/snippet}

{#snippet Location()}
  <Content.Section>
    <Section.Header>
      <Section.Title>Ubicación</Section.Title>
    </Section.Header>
    <dl class="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
      <dt class="font-medium">Dirección</dt>
      <dd>{data.property.location.address}</dd>
      {#if data.property.location.suburb}
        <dt class="font-medium">Barrio</dt>
        <dd>{data.property.location.suburb}</dd>
      {/if}
      {#if data.property.location.city || data.property.location.town}
        <dt class="font-medium">Ciudad</dt>
        <dd>
          {data.property.location.city ||
            data.property.location.town}
        </dd>
      {/if}
      {#if data.property.location.state}
        <dt class="font-medium">Provincia</dt>
        <dd>{data.property.location.state}</dd>
      {/if}
    </dl>
  </Content.Section>
{/snippet}

{#snippet Destinies()}
  {#if data.property.destinies && data.property.destinies.length > 0}
    <Content.Section>
      <Section.Header>
        <Section.Title>Destino</Section.Title>
      </Section.Header>
      <ul class="flex flex-col gap-2">
        {#each data.property.destinies as destiny}
          {@render InfoRow(
            get_property_destiny_label(destiny),
          )}
        {/each}
      </ul>
    </Content.Section>
  {/if}
{/snippet}

{#snippet Rooms()}
  {#if data.property.rooms && data.property.rooms.length > 0}
    <Content.Section>
      <Section.Header>
        <Section.Title>Ambientes</Section.Title>
      </Section.Header>
      <ul class="flex flex-col gap-2">
        {#each data.property.rooms as room (room.id)}
          {@render InfoRow(
            display_room_type(room.type),
            room.length && room.width
              ? `${room.length}m × ${room.width}m`
              : undefined,
          )}
        {/each}
      </ul>
    </Content.Section>
  {/if}
{/snippet}

{#snippet RoomMapSection()}
  {#if data.property.rooms && data.property.rooms.length > 0}
    <Content.Section>
      <Section.Header>
        <Section.Title>Mapa de ambientes</Section.Title>
      </Section.Header>
      <RoomMap
        rooms={data.property.rooms}
        is_readonly={true}
      />
    </Content.Section>
  {/if}
{/snippet}

{#snippet Photos()}
  {#if data.property.images && data.property.images.length > 0}
    <Content.Section>
      <Section.Header>
        <Section.Title>Fotos</Section.Title>
      </Section.Header>
      <ul
        class="!grid grid-cols-1 min-[800px]:grid-cols-2 min-[1200px]:grid-cols-3 gap-4 list-none p-0 m-0"
      >
        {#each data.property.images as image (`image_${image.id}`)}
          <li>
            <img
              class="w-full aspect-video object-cover block rounded"
              alt="Foto de la propiedad"
              src={`data:image/webp;base64,${image.content}`}
            />
          </li>
        {/each}
      </ul>
    </Content.Section>
  {/if}
{/snippet}

<Content.Root>
  <Content.Header>
    <Content.Title>Propiedad</Content.Title>
    <Content.Actions>
      <a
        href={data.has_credit_report
          ? `/properties/${data.property.id}/book`
          : "/learn/booking"}
      >
        <Button>Reservar</Button>
      </a>
    </Content.Actions>
  </Content.Header>
  {@render Location()}
  {@render Destinies()}
  {@render Rooms()}
  {@render RoomMapSection()}
  {@render Photos()}
</Content.Root>

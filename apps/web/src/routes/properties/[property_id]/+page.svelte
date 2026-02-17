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
  <li class="info-row">
    <span class="info-label">{label}</span>
    {#if detail}
      <span class="info-detail">{detail}</span>
    {/if}
  </li>
{/snippet}

{#snippet Location()}
  <Content.Section>
    <Section.Header>
      <Section.Title>Ubicación</Section.Title>
    </Section.Header>
    <dl class="location-grid">
      <dt class="dt-label">Dirección</dt>
      <dd>{data.property.location.address}</dd>
      {#if data.property.location.suburb}
        <dt class="dt-label">Barrio</dt>
        <dd>{data.property.location.suburb}</dd>
      {/if}
      {#if data.property.location.city || data.property.location.town}
        <dt class="dt-label">Ciudad</dt>
        <dd>
          {data.property.location.city ||
            data.property.location.town}
        </dd>
      {/if}
      {#if data.property.location.state}
        <dt class="dt-label">Provincia</dt>
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
      <ul class="info-list">
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
      <ul class="info-list">
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
      <ul class="photo-grid">
        {#each data.property.images as image (`image_${image.id}`)}
          <li>
            <img
              class="photo"
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

<style>
  .info-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem;
    border: 2px solid rgb(55 65 81);
    border-radius: 0.25rem;
  }
  .info-label {
    font-weight: 500;
    color: rgb(249 250 251);
  }
  .info-detail {
    color: rgb(209 213 219);
  }
  .location-grid {
    display: grid;
    grid-template-columns: auto 1fr;
    column-gap: 1rem;
    row-gap: 0.5rem;
  }
  .dt-label {
    font-weight: 500;
  }
  .info-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
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
    border-radius: 0.25rem;
  }
</style>

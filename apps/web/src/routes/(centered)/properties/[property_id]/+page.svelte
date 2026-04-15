<script lang="ts">
  import * as Content from "$lib/components/Content"
  import Tab from "$lib/components/Tab.svelte"
  import TabGroup from "$lib/components/TabGroup.svelte"
  import { CONTRACT_STATE } from "$lib/contract_state"
  import { get_property_destiny_label } from "$lib/property_destiny"
  import {
    PROPERTY_TAG_TYPE,
    PROPERTY_TAG_CATEGORIES,
    get_property_tag_type_label,
    type PropertyTagType,
  } from "$lib/property_tag_type"
  import { ROOM_TYPE } from "$lib/room_type"
  import { get_service_type_label } from "$lib/service"
  import { get_warranty_type_label } from "$lib/warranty_type"
  import PropertyMap from "$lib/components/PropertyMap.svelte"
  import Visualizer from "./components/Visualizer.svelte"
  import AdminCard from "./components/AdminCard.svelte"
  import OrganizationCard from "./components/OrganizationCard.svelte"
  import PricingCard from "./components/PricingCard.svelte"
  import DetailRow from "./components/DetailRow.svelte"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  const active_contract = $derived(
    data.property.contracts.find(
      (contract) =>
        contract.state === CONTRACT_STATE.ACTIVE,
    ) ?? data.property.contracts[0],
  )

  const all_rooms = $derived(
    data.property.floors.flatMap((floor) => floor.rooms),
  )

  const image_count = $derived(data.property.images.length)

  const property_tags = $derived(
    new Set(data.property.tags.map((tag) => tag.type)),
  )

  function get_tags_for_category(
    label: string,
  ): string[] {
    const category = PROPERTY_TAG_CATEGORIES.find(
      (category) => category.label === label,
    )
    if (!category) return []
    return category.tags
      .filter((tag) => property_tags.has(tag))
      .map((tag) =>
        get_property_tag_type_label(tag as PropertyTagType),
      )
  }

  const room_count = $derived(all_rooms.length)
  const bedroom_count = $derived(
    all_rooms.filter(
      (room) => room.type === ROOM_TYPE.BEDROOM,
    ).length,
  )
  const bathroom_count = $derived(
    all_rooms.filter(
      (room) => room.type === ROOM_TYPE.BATHROOM,
    ).length,
  )
  const total_area = $derived(
    all_rooms.reduce((sum, room) => {
      const width = Number(room.width) || 0
      const length = Number(room.length) || 0
      return sum + width * length
    }, 0),
  )

  const TABS = [
    "Condiciones",
    "Propiedad",
    "Edificio",
    "Servicios",
    "Otros",
  ]

  let active_tab = $state("Condiciones")
</script>

{#snippet Gallery()}
  <div
    class="gallery"
    class:one={image_count === 1}
    class:two={image_count === 2}
    class:three={image_count === 3}
    class:four={image_count === 4}
    class:five={image_count >= 5}
  >
    {#each data.property.images.slice(0, 5) as image, index (`image_${image.id}_${index}`)}
      <img
        class="gallery-image"
        class:main={image_count >= 5 && index === 0}
        alt={image.alt}
        src={image.props.src}
        srcset={image.props.srcSet}
        sizes={image.props.sizes}
        onerror={(event) => {
          const target =
            event.currentTarget as HTMLImageElement
          target.srcset = ""
          target.src = "/placeholder.svg"
        }}
      />
    {/each}
  </div>
{/snippet}

{#snippet CondicionesTab()}
  <div class="tab-content">
    {#if active_contract}
      <DetailRow
        label="Garantías aceptadas"
        items={active_contract.files.length > 0
          ? ["Garantía requerida"]
          : []}
      />
    {/if}
  </div>
{/snippet}

{#snippet PropiedadTab()}
  <div class="tab-content">
    <DetailRow
      label="Destino"
      items={data.property.destinies?.map(
        get_property_destiny_label,
      ) ?? []}
    />
    <DetailRow
      label="Unidad"
      items={get_tags_for_category("Unidad")}
    />
    <DetailRow
      label="Ambientes"
      items={[
        `${total_area} m² superficie total`,
        `${room_count} ambientes`,
        `${bedroom_count} dormitorios`,
        `${bathroom_count} baños`,
      ]}
    />
  </div>
{/snippet}

{#snippet EdificioTab()}
  <div class="tab-content">
    <DetailRow
      label="Edificio"
      items={get_tags_for_category("Edificio")}
    />
  </div>
{/snippet}

{#snippet ServiciosTab()}
  <div class="tab-content">
    <DetailRow
      label="Servicios"
      items={data.property.services.map((service) =>
        get_service_type_label(service.type as import("$lib/service").ServiceType),
      )}
    />
    <DetailRow
      label="Equipamiento"
      items={get_tags_for_category("Equipamiento")}
    />
    <DetailRow
      label="Climatización"
      items={get_tags_for_category("Climatización")}
    />
  </div>
{/snippet}

{#snippet OtrosTab()}
  <div class="tab-content">
    <DetailRow
      label="Ambientes"
      items={get_tags_for_category("Ambientes")}
    />
    <DetailRow
      label="Amenities"
      items={get_tags_for_category("Amenities")}
    />
    <DetailRow
      label="Mascotas"
      items={get_tags_for_category("Mascotas")}
    />
  </div>
{/snippet}

{#snippet Details()}
  <div class="card">
    <h2 class="heading-md details-title">Detalles</h2>
    <TabGroup>
      {#each TABS as tab}
        <Tab
          active={active_tab === tab}
          onclick={() => (active_tab = tab)}
        >
          {tab}
        </Tab>
      {/each}
    </TabGroup>
    {#if active_tab === "Condiciones"}
      {@render CondicionesTab()}
    {:else if active_tab === "Propiedad"}
      {@render PropiedadTab()}
    {:else if active_tab === "Edificio"}
      {@render EdificioTab()}
    {:else if active_tab === "Servicios"}
      {@render ServiciosTab()}
    {:else if active_tab === "Otros"}
      {@render OtrosTab()}
    {/if}
  </div>
{/snippet}

{#snippet Sidebar()}
  <aside class="sidebar">
    {#if data.manager}
      <AdminCard
        manager={data.manager}
        property_id={data.property.id}
      />
    {/if}
    {#if data.organization}
      <OrganizationCard
        organization={data.organization}
      />
    {/if}
  </aside>
{/snippet}

{#snippet Ubicacion()}
  <div class="card">
    <h2 class="heading-md ubicacion-title">Ubicación</h2>
    <PropertyMap
      latitude={data.property.location.latitude}
      longitude={data.property.location.longitude}
    />
  </div>
{/snippet}

<Content.Root>
  <Visualizer
    images={Gallery}
    rooms={all_rooms}
  />
  <div class="layout">
    <div class="main">
      <PricingCard
        location={data.property.location}
        initial_price={active_contract?.initial_price ?? null}
        expenses={null}
        escalation_type={null}
        escalation_frequency={null}
      />
      {@render Details()}
      {@render Ubicacion()}
    </div>
    {@render Sidebar()}
  </div>
</Content.Root>

<style>
  .gallery {
    display: grid;
    gap: var(--dimension-spacing-2);
    height: 100%;
  }

  .gallery.one {
    grid-template-columns: 1fr;
  }

  .gallery.two {
    grid-template-columns: 1fr 1fr;
  }

  .gallery.three {
    grid-template-columns: 1fr 1fr 1fr;
  }

  .gallery.four {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .gallery.five {
    grid-template-columns: 1fr 1fr 1fr;
    grid-template-rows: 1fr 1fr;
  }

  .gallery-image {
    width: 100%;
    height: 100%;
    min-height: 0;
    object-fit: cover;
    border-radius: var(--dimension-radius-lg);
  }

  .gallery-image.main {
    grid-row: 1 / -1;
  }

  .layout {
    display: flex;
    gap: var(--dimension-spacing-6);
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
    min-width: 0;
  }

  .sidebar {
    width: 280px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
    padding: var(--dimension-spacing-4);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-xl);
  }

  .details-title {
    color: var(--color-text-heading);
  }

  .tab-content {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
    padding-top: var(--dimension-spacing-4);
  }

  .ubicacion-title {
    color: var(--color-text-heading);
  }

</style>

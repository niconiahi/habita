<script lang="ts">
  import { enhance } from "$app/forms"
  import Button from "$lib/components/Button.svelte"
  import PropertyCard from "$lib/components/PropertyCard.svelte"
  import ToggleButton from "$lib/components/ToggleButton.svelte"
  import RangeFilter from "$lib/components/RangeFilter.svelte"
  import ZoneInput from "$lib/components/ZoneInput.svelte"
  import { compose_action } from "$lib/compose_action"
  import {
    PROPERTY_TAG_CATEGORIES,
    get_property_tag_type_label,
  } from "$lib/property_tag_type"
  import {
    SERVICE_TYPE,
    get_service_type_label,
  } from "$lib/service"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  let filters_dialog: HTMLDialogElement | undefined =
    $state()

  function handle_open_filters() {
    filters_dialog?.showModal()
  }

  function handle_close_filters() {
    filters_dialog?.close()
  }

  const active_tag_ids = $derived(
    data.filters.tags
      ? data.filters.tags
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => !Number.isNaN(n))
      : [],
  )
  const active_service_ids = $derived(
    data.filters.services
      ? data.filters.services
          .split(",")
          .map((s) => Number(s.trim()))
          .filter((n) => !Number.isNaN(n))
      : [],
  )
  const range_hidden_entries = $derived(
    Object.entries(data.filters).filter(
      ([key, value]) =>
        key !== "zone_id" &&
        key !== "tags" &&
        key !== "services" &&
        value !== undefined,
    ),
  )
  const tag_groups = PROPERTY_TAG_CATEGORIES.map(
    (category) => ({
      label: category.label,
      tags: category.tags.map((type) => ({
        id: type,
        label: get_property_tag_type_label(type),
      })),
    }),
  )
  const service_group = {
    label: "Servicios",
    services: Object.values(SERVICE_TYPE).map((type) => ({
      id: type,
      label: get_service_type_label(type),
    })),
  }

  function toggle_id(
    current: number[],
    id: number,
  ): string {
    if (current.includes(id)) {
      return current.filter((n) => n !== id).join(",")
    }
    return [...current, id].join(",")
  }
</script>

{#snippet ZoneFilter()}
  <form
    class="zone-form"
    method="POST"
    action={compose_action(ACTION.SET_FILTERS)}
    use:enhance
  >
    <ZoneInput
      items={data.zone_items}
      default_value={data.selected_zone}
    />
    <input
      type="hidden"
      name="tags"
      value={data.filters.tags ?? ""}
    />
    <input
      type="hidden"
      name="services"
      value={data.filters.services ?? ""}
    />
    {#each range_hidden_entries as [name, value] (name)}
      <input type="hidden" {name} value={String(value)} />
    {/each}
    <Button variant="secondary" type="submit">
      Buscar zona
    </Button>
  </form>
{/snippet}

{#snippet TagFilters()}
  <div class="filter-tags">
    {#each tag_groups as group (group.label)}
      <div class="filter-group">
        <span class="body-sm-medium filter-group-label">
          {group.label}
        </span>
        <div class="filter-group-tags">
          {#each group.tags as tag (tag.id)}
            <form
              method="POST"
              action={compose_action(ACTION.SET_FILTERS)}
              use:enhance
            >
              {#if data.filters.zone_id}
                <input
                  type="hidden"
                  name="zone_id"
                  value={data.filters.zone_id}
                />
              {/if}
              <input
                type="hidden"
                name="tags"
                value={toggle_id(active_tag_ids, tag.id)}
              />
              <input
                type="hidden"
                name="services"
                value={data.filters.services ?? ""}
              />
              {#each range_hidden_entries as [name, value] (name)}
                <input
                  type="hidden"
                  {name}
                  value={String(value)}
                />
              {/each}
              <ToggleButton
                label={tag.label}
                active={active_tag_ids.includes(tag.id)}
              />
            </form>
          {/each}
        </div>
      </div>
    {/each}
    <div class="filter-group">
      <span class="body-sm-medium filter-group-label">
        {service_group.label}
      </span>
      <div class="filter-group-tags">
        {#each service_group.services as service (service.id)}
          <form
            method="POST"
            action={compose_action(ACTION.SET_FILTERS)}
            use:enhance
          >
            {#if data.filters.zone_id}
              <input
                type="hidden"
                name="zone_id"
                value={data.filters.zone_id}
              />
            {/if}
            <input
              type="hidden"
              name="tags"
              value={data.filters.tags ?? ""}
            />
            <input
              type="hidden"
              name="services"
              value={toggle_id(
                active_service_ids,
                service.id,
              )}
            />
            {#each range_hidden_entries as [name, value] (name)}
              <input
                type="hidden"
                {name}
                value={String(value)}
              />
            {/each}
            <ToggleButton
              label={service.label}
              active={active_service_ids.includes(
                service.id,
              )}
            />
          </form>
        {/each}
      </div>
    </div>
  </div>
{/snippet}

{#snippet RangeFilters()}
  <form
    method="POST"
    action={compose_action(ACTION.SET_FILTERS)}
    use:enhance
  >
    {#if data.filters.zone_id}
      <input
        type="hidden"
        name="zone_id"
        value={data.filters.zone_id}
      />
    {/if}
    <input
      type="hidden"
      name="tags"
      value={data.filters.tags ?? ""}
    />
    <input
      type="hidden"
      name="services"
      value={data.filters.services ?? ""}
    />
    <div class="filter-ranges-grid">
      <RangeFilter
        label="Superficie total"
        name="total_surface"
        min={0}
        max={500}
        value_min={data.filters.total_surface_min}
        value_max={data.filters.total_surface_max}
      />
      <RangeFilter
        label="Antigüedad"
        name="construction_year"
        min={1900}
        max={2026}
        value_min={data.filters.construction_year_min}
        value_max={data.filters.construction_year_max}
      />
      <RangeFilter
        label="Ambientes"
        name="ambientes"
        min={0}
        max={10}
        value_min={data.filters.ambientes_min}
        value_max={data.filters.ambientes_max}
      />
      <RangeFilter
        label="Dormitorios"
        name="dormitorios"
        min={0}
        max={8}
        value_min={data.filters.dormitorios_min}
        value_max={data.filters.dormitorios_max}
      />
      <RangeFilter
        label="Baños"
        name="banos"
        min={0}
        max={5}
        value_min={data.filters.banos_min}
        value_max={data.filters.banos_max}
      />
    </div>
    <Button variant="primary" type="submit">
      Filtrar
    </Button>
  </form>
{/snippet}

{#snippet Filters()}
  <div class="filters">
    {@render ZoneFilter()}
    {@render TagFilters()}
    {@render RangeFilters()}
  </div>
{/snippet}

{#snippet Properties()}
  <ul class="property-list">
    {#each data.properties as property (property.id)}
      <li>
        <PropertyCard
          images={property.images}
          label={`Imagenes de ${property.location}`}
          price={property.price}
          escalation={property.escalation}
          location={property.location}
          room_count={property.room_count}
          total_surface={property.total_surface}
          bathroom_count={property.bathroom_count}
          href={`/properties/${property.id}`}
        />
      </li>
    {/each}
  </ul>
{/snippet}

<div class="page">
  <div class="toolbar">
    <a href="/properties" class="clear-link">
      <Button variant="secondary">Limpiar filtros</Button>
    </a>
    <Button variant="primary" onclick={handle_open_filters}>
      Aplicar filtros
    </Button>
  </div>
  <dialog
    bind:this={filters_dialog}
    class="filters-dialog"
  >
    <div class="filters-header">
      <span class="heading-sm">Filtros</span>
      <Button
        variant="tertiary"
        onclick={handle_close_filters}
      >
        Cerrar
      </Button>
    </div>
    {@render Filters()}
  </dialog>
  {@render Properties()}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .toolbar {
    display: flex;
    justify-content: flex-end;
    gap: var(--dimension-spacing-2);
  }

  .clear-link {
    text-decoration: none;
  }

  .filters-dialog {
    border: none;
    border-radius: var(--dimension-radius-lg);
    padding: var(--dimension-spacing-6);
    width: min(90vw, 640px);
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    font-family: var(--font-family-body);
    color: var(--color-text-body);
    margin: auto;
  }

  .filters-dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.4);
  }

  .filters-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--dimension-spacing-6);
  }

  .zone-form {
    display: flex;
    align-items: flex-end;
    gap: var(--dimension-spacing-2);
  }

  .zone-form > :global(div) {
    flex: 1;
  }

  .zone-form :global(input) {
    height: var(--dimension-spacing-10);
  }

  .filters {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
  }

  .filter-tags {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .filter-group-label {
    color: var(--color-text-heading);
  }

  .filter-group-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--dimension-spacing-2);
  }

  .filter-ranges-grid {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .property-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--dimension-spacing-4);
    list-style: none;
    padding: 0;
    margin: 0;
  }
</style>

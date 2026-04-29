<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Dialog from "$lib/components/Dialog"
  import Button from "$lib/components/Button.svelte"
  import PropertyCard from "$lib/components/PropertyCard.svelte"
  import ToggleButton from "$lib/components/ToggleButton.svelte"
  import RangeFilter from "$lib/components/RangeFilter.svelte"
  import ZoneInput from "$lib/components/ZoneInput.svelte"
  import { display_location } from "$lib/display_location"
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

  function parse_ids(
    param: string | undefined,
  ): Set<number> {
    if (!param) return new Set()
    return new Set(
      param
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n)),
    )
  }

  function init_filters() {
    return {
      zone_id: data.filters.zone_id ?? null,
      tags: parse_ids(data.filters.tags),
      services: parse_ids(data.filters.services),
      total_surface_min: data.filters.total_surface_min,
      total_surface_max: data.filters.total_surface_max,
      construction_year_min:
        data.filters.construction_year_min,
      construction_year_max:
        data.filters.construction_year_max,
      ambientes_min: data.filters.ambientes_min,
      ambientes_max: data.filters.ambientes_max,
      dormitorios_min: data.filters.dormitorios_min,
      dormitorios_max: data.filters.dormitorios_max,
      banos_min: data.filters.banos_min,
      banos_max: data.filters.banos_max,
    }
  }

  let current_filters = $state(init_filters())

  $effect(() => {
    current_filters = {
      zone_id: data.filters.zone_id ?? null,
      tags: parse_ids(data.filters.tags),
      services: parse_ids(data.filters.services),
      total_surface_min: data.filters.total_surface_min,
      total_surface_max: data.filters.total_surface_max,
      construction_year_min:
        data.filters.construction_year_min,
      construction_year_max:
        data.filters.construction_year_max,
      ambientes_min: data.filters.ambientes_min,
      ambientes_max: data.filters.ambientes_max,
      dormitorios_min: data.filters.dormitorios_min,
      dormitorios_max: data.filters.dormitorios_max,
      banos_min: data.filters.banos_min,
      banos_max: data.filters.banos_max,
    }
  })

  function toggle_tag(id: number) {
    if (current_filters.tags.has(id)) {
      current_filters.tags.delete(id)
    } else {
      current_filters.tags.add(id)
    }
    current_filters.tags = new Set(current_filters.tags)
  }

  function toggle_service(id: number) {
    if (current_filters.services.has(id)) {
      current_filters.services.delete(id)
    } else {
      current_filters.services.add(id)
    }
    current_filters.services = new Set(
      current_filters.services,
    )
  }

  function reset_filters() {
    current_filters = init_filters()
  }

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
</script>

{#snippet ZoneFilter()}
  <div class="zone-form">
    <ZoneInput
      items={data.zone_items}
      default_value={data.selected_zone}
    />
    <Button
      variant="secondary"
      type="button"
      onclick={() => {
        const zone_input =
          document.querySelector<HTMLInputElement>(
            'input[name="zone_id"]',
          )
        if (zone_input) {
          current_filters.zone_id = zone_input.value
            ? Number(zone_input.value)
            : null
        }
      }}
    >
      Buscar zona
    </Button>
  </div>
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
            <ToggleButton
              label={tag.label}
              active={current_filters.tags.has(tag.id)}
              onclick={() => toggle_tag(tag.id)}
            />
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
          <ToggleButton
            label={service.label}
            active={current_filters.services.has(
              service.id,
            )}
            onclick={() => toggle_service(service.id)}
          />
        {/each}
      </div>
    </div>
  </div>
{/snippet}

{#snippet RangeFilters()}
  <div class="filter-ranges-grid">
    <RangeFilter
      label="Superficie total"
      name="total_surface"
      min={0}
      max={500}
      bind:value_min={current_filters.total_surface_min}
      bind:value_max={current_filters.total_surface_max}
    />
    <RangeFilter
      label="Antigüedad"
      name="construction_year"
      min={1900}
      max={2026}
      bind:value_min={current_filters.construction_year_min}
      bind:value_max={current_filters.construction_year_max}
    />
    <RangeFilter
      label="Ambientes"
      name="ambientes"
      min={0}
      max={10}
      bind:value_min={current_filters.ambientes_min}
      bind:value_max={current_filters.ambientes_max}
    />
    <RangeFilter
      label="Dormitorios"
      name="dormitorios"
      min={0}
      max={8}
      bind:value_min={current_filters.dormitorios_min}
      bind:value_max={current_filters.dormitorios_max}
    />
    <RangeFilter
      label="Baños"
      name="banos"
      min={0}
      max={5}
      bind:value_min={current_filters.banos_min}
      bind:value_max={current_filters.banos_max}
    />
  </div>
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
          label={`Imagenes de ${display_location(property.location)}`}
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
    <Button
      variant="primary"
      onclick={() => filters_dialog?.showModal()}
    >
      Aplicar filtros
    </Button>
  </div>
  <Dialog.Root bind:element={filters_dialog}>
    {#snippet children({ close })}
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Filtros</Dialog.Title>
          <Dialog.Close
            onclick={() => {
              reset_filters()
              close()
            }}
          />
        </Dialog.Header>
        {@render Filters()}
        <form
          method="POST"
          action={compose_action(ACTION.SET_FILTERS)}
          use:enhance={() => {
            close()
            return async ({ update }) => {
              await update()
            }
          }}
        >
          {#if current_filters.zone_id}
            <input
              type="hidden"
              name="zone_id"
              value={current_filters.zone_id}
            />
          {/if}
          <input
            type="hidden"
            name="tags"
            value={[...current_filters.tags].join(",")}
          />
          <input
            type="hidden"
            name="services"
            value={[...current_filters.services].join(",")}
          />
          {#if current_filters.total_surface_min !== undefined}
            <input
              type="hidden"
              name="total_surface_min"
              value={current_filters.total_surface_min}
            />
          {/if}
          {#if current_filters.total_surface_max !== undefined}
            <input
              type="hidden"
              name="total_surface_max"
              value={current_filters.total_surface_max}
            />
          {/if}
          {#if current_filters.construction_year_min !== undefined}
            <input
              type="hidden"
              name="construction_year_min"
              value={current_filters.construction_year_min}
            />
          {/if}
          {#if current_filters.construction_year_max !== undefined}
            <input
              type="hidden"
              name="construction_year_max"
              value={current_filters.construction_year_max}
            />
          {/if}
          {#if current_filters.ambientes_min !== undefined}
            <input
              type="hidden"
              name="ambientes_min"
              value={current_filters.ambientes_min}
            />
          {/if}
          {#if current_filters.ambientes_max !== undefined}
            <input
              type="hidden"
              name="ambientes_max"
              value={current_filters.ambientes_max}
            />
          {/if}
          {#if current_filters.dormitorios_min !== undefined}
            <input
              type="hidden"
              name="dormitorios_min"
              value={current_filters.dormitorios_min}
            />
          {/if}
          {#if current_filters.dormitorios_max !== undefined}
            <input
              type="hidden"
              name="dormitorios_max"
              value={current_filters.dormitorios_max}
            />
          {/if}
          {#if current_filters.banos_min !== undefined}
            <input
              type="hidden"
              name="banos_min"
              value={current_filters.banos_min}
            />
          {/if}
          {#if current_filters.banos_max !== undefined}
            <input
              type="hidden"
              name="banos_max"
              value={current_filters.banos_max}
            />
          {/if}
          <Button variant="primary" type="submit">
            Aplicar filtros
          </Button>
        </form>
      </Dialog.Content>
    {/snippet}
  </Dialog.Root>
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

  .property-list:has(:global(.carousel-wrapper):hover)
    :global(.carousel-wrapper):not(:hover) {
    filter: brightness(0.45);
    transition: filter 0.3s ease;
  }

  form :global(.button) {
    width: 100%;
  }
</style>

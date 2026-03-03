<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Content from "$lib/components/Content"
  import * as Card from "$lib/components/Card"
  import Button from "$lib/components/Button.svelte"
  import PropertyTag from "$lib/components/PropertyTag.svelte"
  import RangeFilter from "$lib/components/RangeFilter.svelte"
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
        key !== "tags" &&
        key !== "services" &&
        value !== undefined,
    ),
  )
  const tag_groups = PROPERTY_TAG_CATEGORIES.map((cat) => ({
    label: cat.label,
    tags: cat.tags.map((type) => ({
      id: type,
      label: get_property_tag_type_label(type),
    })),
  }))
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

{#snippet Filters()}
  <div class="filters">
    <div class="filter-tags">
      {#each tag_groups as group (group.label)}
        <div class="filter-group">
          <span class="filter-group-label"
            >{group.label}</span
          >
          <div class="filter-group-tags">
            {#each group.tags as tag (tag.id)}
              <form
                method="POST"
                action={compose_action(ACTION.SET_FILTERS)}
                use:enhance
              >
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
                <PropertyTag
                  label={tag.label}
                  active={active_tag_ids.includes(tag.id)}
                />
              </form>
            {/each}
          </div>
        </div>
      {/each}
      <div class="filter-group">
        <span class="filter-group-label"
          >{service_group.label}</span
        >
        <div class="filter-group-tags">
          {#each service_group.services as service (service.id)}
            <form
              method="POST"
              action={compose_action(ACTION.SET_FILTERS)}
              use:enhance
            >
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
              <PropertyTag
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
    <div class="filter-ranges">
      <form
        method="POST"
        action={compose_action(ACTION.SET_FILTERS)}
        use:enhance
      >
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
        <Button type="submit">Filtrar</Button>
      </form>
    </div>
  </div>
{/snippet}

{#snippet Properties()}
  <ul class="property-list">
    {#each data.properties as property (property.id)}
      {@const contract = property.contracts[0]}
      {@const price = contract?.current_price}
      {@const images = property.images.map((image) => ({
        src: image.props.src,
        srcSet: image.props.srcSet,
        sizes: image.props.sizes,
        alt: image.alt,
      }))}
      <li>
        <Card.Root>
          <Card.Carousel
            {images}
            label={`Imagenes de ${display_location(property.location)}`}
          />
          <Card.Body>
            <Card.Title>
              {display_location(property.location)}
            </Card.Title>
            <Card.Actions>
              <Card.Action>
                <a href={`/properties/${property.id}`}>
                  <Button>Ver</Button>
                </a>
              </Card.Action>
            </Card.Actions>
            <Card.Content>
              {price
                ? `$${price.toLocaleString("es-AR")}/mes`
                : "Consultar precio"}
            </Card.Content>
          </Card.Body>
        </Card.Root>
      </li>
    {/each}
  </ul>
{/snippet}

<Content.Root>
  <Content.Title>Propiedades</Content.Title>
  <Content.Section>
    {@render Filters()}
  </Content.Section>
  <Content.Section>
    {@render Properties()}
  </Content.Section>
</Content.Root>

<style>
  .property-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 50%;
  }
  .filters {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
  }
  .filter-tags {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
  .filter-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
  .filter-group-label {
    color: var(--gray-100);
    font-size: 0.875rem;
  }
  .filter-group-tags {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
  }
  .filter-ranges {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
  .filter-ranges-grid {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
</style>

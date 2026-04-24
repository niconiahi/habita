<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Popover from "$lib/components/Popover"
  import Button from "$lib/components/Button.svelte"
  import { display_location } from "$lib/display_location"
  import { get_property_type_label } from "$lib/property_type"
  import {
    get_property_state_label,
    PROPERTY_STATE,
  } from "$lib/property_state"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<div class="page">
  <div class="header">
    <h1 class="heading-md title">Propiedades</h1>
    <a href="/admin/properties/new">
      <Button variant="primary">Nueva propiedad</Button>
    </a>
  </div>
  <table class="table">
    <thead>
      <tr>
        <th class="body-sm-bold">Ubicación</th>
        <th class="body-sm-bold">Tipo</th>
        <th class="body-sm-bold">Estado</th>
        <th class="body-sm-bold"></th>
      </tr>
    </thead>
    <tbody>
      {#each data.properties as property (property.id)}
        <tr>
          <td class="body-md-medium">
            <a
              href={`/admin/properties/${property.id}/edit`}
            >
              {display_location(property.location)}
            </a>
          </td>
          <td class="body-md-medium">
            {get_property_type_label(
              property.type,
            )}{property.unit ? ` - ${property.unit}` : ""}
          </td>
          <td class="body-md-medium">
            {get_property_state_label(property.state)}
          </td>
          <td class="actions-cell">
            {#if property.state === PROPERTY_STATE.EDITING || property.state === PROPERTY_STATE.PUBLISHED}
              <Popover.Root
                id={`property-actions-${property.id}`}
              >
                <Popover.Trigger
                  id={`property-actions-${property.id}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <circle cx="12" cy="5" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="12" cy="19" r="2" />
                  </svg>
                </Popover.Trigger>
                <Popover.Content
                  id={`property-actions-${property.id}`}
                >
                  {#snippet children({ close })}
                    <div class="actions-menu">
                      {#if property.state === PROPERTY_STATE.EDITING}
                        <form
                          method="POST"
                          action={`?/${ACTION.PUBLISH_PROPERTY}`}
                          use:enhance
                        >
                          <input
                            type="hidden"
                            name="property_id"
                            value={property.id}
                          />
                          <button
                            class="body-md-medium action-item"
                            type="submit"
                            onclick={close}
                          >
                            Publicar
                          </button>
                        </form>
                      {/if}
                      {#if property.state === PROPERTY_STATE.PUBLISHED}
                        <form
                          method="POST"
                          action={`?/${ACTION.UNPUBLISH_PROPERTY}`}
                          use:enhance
                        >
                          <input
                            type="hidden"
                            name="property_id"
                            value={property.id}
                          />
                          <button
                            class="body-md-medium action-item"
                            type="submit"
                            onclick={close}
                          >
                            Despublicar
                          </button>
                        </form>
                      {/if}
                    </div>
                  {/snippet}
                </Popover.Content>
              </Popover.Root>
            {/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    color: var(--color-text-heading);
  }

  .table {
    width: 100%;
    border-collapse: collapse;
  }

  .table th {
    text-align: left;
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-3);
    color: var(--color-text-body);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .table td {
    padding: var(--dimension-spacing-3);
    color: var(--color-text-body);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .actions-cell {
    text-align: right;
    width: 3rem;
  }

  .actions-menu {
    display: flex;
    flex-direction: column;
    min-width: 12rem;
  }

  .action-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-3);
    background: none;
    border: none;
    border-radius: var(--dimension-radius-default);
    color: var(--color-text-body);
    text-decoration: none;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .action-item:hover {
    background-color: var(--color-neutrals-150);
  }
</style>

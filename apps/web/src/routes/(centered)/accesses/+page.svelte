<script lang="ts">
  import { ACCESS_TYPE } from "$lib/access_type"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<div class="page">
  <h1 class="heading-lg title">Mis propiedades</h1>
  {#if data.properties.length > 0}
    <ul class="property-list">
      {#each data.properties as property (property.id)}
        <li class="property-item">
          <span class="property-name">
            {property.display_name}
          </span>
          <div class="property-links">
            {#each property.access_types as access_type (access_type)}
              {#if access_type === ACCESS_TYPE.MANAGER}
                <a
                  href="/admin/properties/{property.id}/edit"
                >
                  Ver como administrador
                </a>
              {/if}
              {#if access_type === ACCESS_TYPE.TENANT}
                <a
                  href="/properties/{property.id}/tenant"
                >
                  Ver como inquilino
                </a>
              {/if}
              {#if access_type === ACCESS_TYPE.LANDLORD}
                <a
                  href="/properties/{property.id}/landlord"
                >
                  Ver como dueño
                </a>
              {/if}
            {/each}
          </div>
        </li>
      {/each}
    </ul>
  {:else}
    <p class="body-md-medium empty">
      No tenés propiedades asignadas
    </p>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
    padding-top: var(--dimension-spacing-10);
  }

  .title {
    color: var(--color-text-heading);
  }

  .property-list {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .property-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--dimension-spacing-4);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-md);
  }

  .property-name {
    font-weight: 500;
    color: var(--color-text-heading);
  }

  .property-links {
    display: flex;
    gap: var(--dimension-spacing-4);
  }

  .empty {
    color: var(--color-text-body);
  }
</style>

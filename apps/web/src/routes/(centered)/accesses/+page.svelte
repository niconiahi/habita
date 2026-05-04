<script lang="ts">
  import { goto } from "$app/navigation"
  import { authClient } from "$lib/auth-client"
  import { ACCESS_TYPE } from "$lib/access_type"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  async function handle_go_to_organization(
    organization_id: string,
  ) {
    await authClient.organization.setActive({
      organizationId: organization_id,
    })
    goto("/admin/properties")
  }
</script>

<div class="page">
  <h1 class="heading-lg title">Mis accesos</h1>

  {#if data.organizations.length > 0}
    <section class="section">
      <h2 class="heading-md section-title">
        Inmobiliarias
      </h2>
      <ul class="list">
        {#each data.organizations as organization (organization.id)}
          <li class="list-item">
            <span class="item-name">
              {organization.name}
            </span>
            <button
              class="body-md-medium go-link"
              type="button"
              onclick={() =>
                handle_go_to_organization(
                  organization.id,
                )}
            >
              Ir a administrar
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <section class="section">
    <h2 class="heading-md section-title">Propiedades</h2>
    {#if data.properties.length > 0}
      <ul class="list">
        {#each data.properties as property (property.id)}
          <li class="list-item">
            <span class="item-name">
              {property.display_name}
            </span>
            <div class="property-links">
              {#each property.access_types as access_type (access_type)}
                {#if access_type === ACCESS_TYPE.MANAGER}
                  <a
                    href="/admin/properties/{property.id}/edit/characteristics"
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
  </section>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-8);
    padding-top: var(--dimension-spacing-10);
  }

  .title {
    color: var(--color-text-heading);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .section-title {
    color: var(--color-text-heading);
  }

  .list {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--dimension-spacing-4);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-md);
  }

  .item-name {
    font-weight: 500;
    color: var(--color-text-heading);
  }

  .property-links {
    display: flex;
    gap: var(--dimension-spacing-4);
  }

  .go-link {
    color: var(--color-blue-500);
    background: none;
    border: none;
    cursor: pointer;
    white-space: nowrap;
  }

  .go-link:hover {
    text-decoration: underline;
  }

  .empty {
    color: var(--color-text-body);
  }
</style>

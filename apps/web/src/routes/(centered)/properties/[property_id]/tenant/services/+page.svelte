<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import {
    get_service_type_label,
    type ServiceType,
  } from "$lib/service"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

{#if data.services.length > 0}
  <Content.Section>
    <Section.Header>
      <Section.Title>Códigos de servicio</Section.Title>
    </Section.Header>
    <div class="info-list">
      {#each data.services as service (service.id)}
        <div class="info-row">
          <span class="info-label">
            {get_service_type_label(service.type as ServiceType)}
          </span>
          <span>{service.code}</span>
        </div>
      {/each}
    </div>
  </Content.Section>
{:else}
  <p class="body-md-medium empty">
    No hay servicios registrados
  </p>
{/if}

<style>
  .info-list {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .info-label {
    font-weight: 500;
    min-width: 120px;
  }

  .empty {
    color: var(--color-text-body);
  }
</style>

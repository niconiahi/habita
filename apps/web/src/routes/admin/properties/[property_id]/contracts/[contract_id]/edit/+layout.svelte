<script lang="ts">
  import { page } from "$app/state"
  import * as Breadcrumb from "$lib/components/Breadcrumb"
  import Tab from "$lib/components/Tab.svelte"
  import TabGroup from "$lib/components/TabGroup.svelte"
  import type { LayoutData } from "./$types"
  import type { Snippet } from "svelte"

  const CONTRACT_TABS = [
    { route: "sections", label: "secciones" },
    { route: "documents", label: "documentos" },
    { route: "periods", label: "periodos" },
  ] as const

  let {
    data,
    children,
  }: { data: LayoutData; children: Snippet } = $props()

  const base_path = $derived(
    `/admin/properties/${data.property.id}/contracts/${data.contract.id}/edit`,
  )

  function is_active(route: string) {
    return page.url.pathname.includes(`/${route}`)
  }
</script>

<div class="page">
  <Breadcrumb.Root>
    <Breadcrumb.Link href="/admin/properties"
      >Propiedades</Breadcrumb.Link
    >
    <Breadcrumb.Link
      href="/admin/properties/{data.property
        .id}/edit/characteristics"
    >
      {data.property.location?.road ?? "Sin calle"}
      {data.property.location?.house_number ?? ""}
    </Breadcrumb.Link>
    <Breadcrumb.Current>Contrato</Breadcrumb.Current>
  </Breadcrumb.Root>
  <h1 class="heading-md page-title">
    contrato {data.contract.id}
  </h1>
  {#if data.is_read_only}
    <div class="read-only-banner">
      <p class="body-sm-medium">
        El contrato está activo. La edición está bloqueada.
      </p>
    </div>
  {/if}
  <TabGroup>
    {#each CONTRACT_TABS as tab}
      <Tab active={is_active(tab.route)}>
        <a href={`${base_path}/${tab.route}`}>{tab.label}</a
        >
      </Tab>
    {/each}
  </TabGroup>
  {@render children()}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
  }

  .page-title {
    color: var(--color-text-heading);
  }

  .read-only-banner {
    padding: var(--dimension-spacing-3);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-2);
    background-color: var(--color-neutrals-50);
    color: var(--color-text-heading);
  }
</style>

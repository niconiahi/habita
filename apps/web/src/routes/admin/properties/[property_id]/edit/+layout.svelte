<script lang="ts">
  import { page } from "$app/state"
  import * as Breadcrumb from "$lib/components/Breadcrumb"
  import Tab from "$lib/components/Tab.svelte"
  import TabGroup from "$lib/components/TabGroup.svelte"
  import type { LayoutData } from "./$types"
  import type { Snippet } from "svelte"

  const PROPERTY_TABS = [
    { route: "characteristics", label: "caracteristicas" },
    { route: "members", label: "miembros" },
    { route: "visits", label: "visitas" },
    { route: "contracts", label: "contratos" },
    { route: "layout", label: "disposicion" },
    { route: "photos", label: "fotos" },
  ] as const

  let {
    data,
    children,
  }: { data: LayoutData; children: Snippet } = $props()

  const base_path = $derived(
    `/admin/properties/${data.property.id}/edit`,
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
    <Breadcrumb.Current>
      {data.property.location?.road ?? "Sin calle"}
      {data.property.location?.house_number ?? ""}
    </Breadcrumb.Current>
  </Breadcrumb.Root>
  <h1 class="heading-md page-title">
    propiedad {data.property.id}
  </h1>
  <TabGroup>
    {#each PROPERTY_TABS as tab}
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
</style>

<script lang="ts">
  import { page } from "$app/state"
  import Tab from "$lib/components/Tab.svelte"
  import TabGroup from "$lib/components/TabGroup.svelte"
  import * as Content from "$lib/components/Content"
  import type { LayoutData } from "./$types"
  import type { Snippet } from "svelte"

  const TENANT_TABS = [
    {
      route: "receipts",
      label: "comprobantes",
      exact: false,
    },
    { route: "tenant", label: "contrato", exact: true },
    { route: "services", label: "servicios", exact: false },
  ] as const

  let {
    data,
    children,
  }: { data: LayoutData; children: Snippet } = $props()

  const base_path = $derived(
    `/properties/${data.property_id}/tenant`,
  )

  function is_active(route: string, exact: boolean) {
    if (exact) {
      return page.url.pathname === base_path
    }
    return page.url.pathname.includes(`/${route}`)
  }

  function get_href(route: string, exact: boolean) {
    if (exact) {
      return base_path
    }
    return `${base_path}/${route}`
  }
</script>

<Content.Root>
  <Content.Title>Panel de inquilino</Content.Title>
  <TabGroup>
    {#each TENANT_TABS as tab}
      <Tab active={is_active(tab.route, tab.exact)}>
        <a href={get_href(tab.route, tab.exact)}
          >{tab.label}</a
        >
      </Tab>
    {/each}
  </TabGroup>
  {@render children()}
</Content.Root>

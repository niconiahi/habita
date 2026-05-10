<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import {
    get_current_disclosure,
    set_current_disclosure,
  } from "$lib/disclousure_cookie.remote"
  import { SERVICE_TYPE } from "$lib/service"
  import { create_service } from "../forms/create_service.remote"
  import type { PageData } from "../$types"
  import ServiceRow from "./service_row.svelte"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("characteristics")

  const all_services_added = $derived(
    data.property.services.length ===
      Object.keys(SERVICE_TYPE).length,
  )
  const used_service_types = $derived(
    new Set(data.property.services.map((s) => s.type)),
  )
</script>

<Disclosure
  title="Servicios"
  name="characteristics"
  open={(await current) === "services"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "characteristics",
      value:
        current.current === "services" ? "" : "services",
    })
  }}
>
  <ul class="service-list">
    {#each data.property.services as service (`service_${service.id}`)}
      <ServiceRow
        {service}
        property_id={data.property.id}
        {used_service_types}
      />
    {/each}
  </ul>
  <form
    {...create_service.enhance(async ({ submit }) => {
      const ok = await submit()
      if (ok) await invalidateAll()
    })}
  >
    <input
      type="hidden"
      name="property_id"
      value={data.property.id}
    />
    <Button
      variant="secondary"
      type="submit"
      disabled={all_services_added}
    >
      Agregar servicio
    </Button>
  </form>
</Disclosure>

<style>
  .service-list {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
    margin-bottom: var(--dimension-spacing-4);
  }
</style>

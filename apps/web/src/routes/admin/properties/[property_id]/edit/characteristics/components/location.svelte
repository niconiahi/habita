<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import LocationInput from "$lib/components/LocationInput.svelte"
  import {
    get_current_disclosure,
    set_current_disclosure,
  } from "$lib/disclousure_cookie.remote"
  import { update_location } from "../forms/update_location.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("characteristics")

  const issues = $derived(
    update_location.fields.location.issues(),
  )
</script>

<Disclosure
  title="Ubicación"
  name="characteristics"
  open={(await current) === "location"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "characteristics",
      value:
        current.current === "location" ? "" : "location",
    })
  }}
>
  <form
    {...update_location.enhance(async ({ submit }) => {
      const ok = await submit()
      if (ok) await invalidateAll()
    })}
  >
    <input
      type="hidden"
      name="property_id"
      value={data.property.id}
    />
    <input
      type="hidden"
      name="id"
      value={data.property.location.id}
    />
    <LocationInput
      default_value={data.property.location.address}
      default_lon={String(data.property.location.longitude)}
      default_lat={String(data.property.location.latitude)}
    />
    {#if issues}
      {#each issues as issue}
        <Formulary.Error>{issue.message}</Formulary.Error>
      {/each}
    {/if}
    <Button variant="primary" type="submit">
      Guardar ubicación
    </Button>
  </form>
</Disclosure>

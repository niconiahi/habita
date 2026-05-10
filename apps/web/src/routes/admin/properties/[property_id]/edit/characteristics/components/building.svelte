<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import {
    get_current_disclosure,
    set_current_disclosure,
  } from "$lib/disclousure_cookie.remote"
  import { update_construction_year } from "../forms/update_construction_year.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("characteristics")

  const issues = $derived(
    update_construction_year.fields.construction_year.issues(),
  )
</script>

<Disclosure
  title="Edificio"
  name="characteristics"
  open={(await current) === "building"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "characteristics",
      value: current.current === "building" ? "" : "building",
    })
  }}
>
  <form
    {...update_construction_year.enhance(
      async ({ submit }) => {
        const ok = await submit()
        if (ok) await invalidateAll()
      },
    )}
  >
    <input
      type="hidden"
      name="property_id"
      value={data.property.id}
    />
    <label for="construction_year">año de construcción</label>
    <input
      {...update_construction_year.fields.construction_year.as(
        "number",
        data.property.construction_year ?? "",
      )}
      id="construction_year"
      min={1900}
      max={2026}
      placeholder="2015"
    />
    {#if issues}
      {#each issues as issue}
        <Formulary.Error>{issue.message}</Formulary.Error>
      {/each}
    {/if}
    <Button variant="primary" type="submit">Guardar año</Button>
  </form>
</Disclosure>

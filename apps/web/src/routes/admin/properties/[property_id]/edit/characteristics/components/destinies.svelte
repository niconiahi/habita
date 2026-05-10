<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import {
    get_current_disclosure,
    set_current_disclosure,
  } from "$lib/disclousure_cookie.remote"
  import {
    get_property_destinies,
    get_property_destiny_label,
  } from "$lib/property_destiny"
  import { update_destinies } from "../forms/update_destinies.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("characteristics")

  const property_destinies = get_property_destinies()

  const issues = $derived(
    update_destinies.fields.destinies.issues(),
  )

  function checkbox_attrs(destiny: number) {
    return (
      update_destinies.fields.destinies as unknown as {
        as: (
          type: "checkbox",
          value: string,
        ) => Record<string, unknown>
      }
    ).as("checkbox", String(destiny))
  }
</script>

<Disclosure
  title="Destino"
  name="characteristics"
  open={(await current) === "destinies"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "characteristics",
      value:
        current.current === "destinies" ? "" : "destinies",
    })
  }}
>
  <form
    {...update_destinies.enhance(async ({ submit }) => {
      const ok = await submit()
      if (ok) await invalidateAll()
    })}
  >
    <input
      type="hidden"
      name="property_id"
      value={data.property.id}
    />
    <fieldset class="checkbox-list">
      <legend>tipos</legend>
      {#each property_destinies as destiny}
        <label class="checkbox-label">
          <input
            {...checkbox_attrs(destiny)}
            checked={data.property.destinies.includes(destiny)}
          />
          {get_property_destiny_label(destiny)}
        </label>
      {/each}
    </fieldset>
    {#if issues}
      {#each issues as issue}
        <Formulary.Error>{issue.message}</Formulary.Error>
      {/each}
    {/if}
    <Button variant="primary" type="submit">
      Guardar destino
    </Button>
  </form>
</Disclosure>

<style>
  .checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    border: none;
    padding: 0;
    margin: 0;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>

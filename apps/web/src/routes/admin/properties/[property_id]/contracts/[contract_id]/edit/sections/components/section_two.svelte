<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { get_current_disclosure, set_current_disclosure } from "$lib/disclousure_cookie.remote"
  import { create_contract_item } from "../forms/create_contract_item.remote"
  import type { PageData } from "../$types"
  import ItemRow from "./item_row.svelte"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("sections")
</script>

<Disclosure
  name="section"
  open={(await current) === "two"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "sections",
      value: current.current === "two" ? "" : "two",
    })
  }}
  title="Sección 2: estado"
>
  <form
    {...create_contract_item.enhance(async ({ submit }) => {
      const ok = await submit()
      if (ok) await invalidateAll()
    })}
  >
    <input
      type="hidden"
      name="contract_id"
      value={data.contract.id}
    />
    <input
      type="hidden"
      name="property_id"
      value={data.property.id}
    />
    <Formulary.Submission form={create_contract_item}>
      {#snippet children({ is_busy, is_done })}
        <Button
          variant="primary"
          type="submit"
          disabled={is_busy()}
        >
          <Formulary.SubmissionLabel
            is_busy={is_busy()}
            is_done={is_done()}
            idle="Agregar item"
            busy="Agregando item..."
            done="Agregado"
          />
        </Button>
      {/snippet}
    </Formulary.Submission>
  </form>
  <ul class="item-list">
    {#each data.contract.contract_items as contract_item (contract_item.id)}
      <ItemRow
        {contract_item}
        contract_id={data.contract.id}
        property_id={data.property.id}
      />
    {/each}
  </ul>
</Disclosure>

<style>
  .item-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
</style>

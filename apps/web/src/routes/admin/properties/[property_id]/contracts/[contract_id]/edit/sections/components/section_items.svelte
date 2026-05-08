<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import SubmitLabel from "$lib/components/SubmitLabel.svelte"
  import { submission_disabled } from "$lib/submission_disabled"
  import { create_contract_item } from "../forms/create_contract_item.remote"
  import type { PageData } from "../$types"
  import ItemRow from "./item_row.svelte"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure name="sections" title="Sección 2: estado">
  <form {...create_contract_item}>
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
    <Button
      variant="primary"
      type="submit"
      disabled={submission_disabled(create_contract_item)}
    >
      <SubmitLabel
        form={create_contract_item}
        idle="Agregar item"
        busy="Agregando item..."
        done="Agregado"
      />
    </Button>
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

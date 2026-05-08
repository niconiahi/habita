<script lang="ts">
  import * as Table from "$lib/components/Table"
  import Button from "$lib/components/Button.svelte"
  import {
    CONTRACT_STATE,
    get_contract_state_label,
  } from "$lib/contract_state"
  import { display_date } from "$lib/display_date"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  const has_editing_contract = $derived(
    data.property.contracts.some(
      (contract) =>
        contract.state === CONTRACT_STATE.EDITING,
    ),
  )
</script>

<section>
  <div class="tab-header">
    <h2 class="heading-sm tab-title">Contratos</h2>
    {#if has_editing_contract}
      <Button variant="secondary" disabled
        >Crear contrato</Button
      >
    {:else}
      <a
        href={`/admin/properties/${data.property.id}/contracts/new`}
      >
        <Button variant="secondary">Crear contrato</Button>
      </a>
    {/if}
  </div>
  <Table.Root>
    <Table.Header>
      <Table.Cell header>Estado</Table.Cell>
      <Table.Cell header>Fecha de finalización</Table.Cell>
      <Table.Cell header>Acciones</Table.Cell>
    </Table.Header>
    <Table.Body>
      {#each data.property.contracts as contract (contract.id)}
        <Table.Row>
          <Table.Cell>
            {get_contract_state_label(contract.state)}
          </Table.Cell>
          <Table.Cell>
            {contract.end_date
              ? display_date(new Date(contract.end_date))
              : "-"}
          </Table.Cell>
          <Table.Cell>
            <a
              href={`/admin/properties/${data.property.id}/contracts/${contract.id}/edit/sections`}
            >
              <Button>Editar</Button>
            </a>
          </Table.Cell>
        </Table.Row>
      {/each}
    </Table.Body>
  </Table.Root>
</section>

<style>
  .tab-title {
    color: var(--color-text-heading);
  }

  .tab-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>

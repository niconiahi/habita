<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Table from "$lib/components/Table"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import {
    CONTRACT_STATE,
    get_contract_state_label,
    get_contract_states,
  } from "$lib/contract_state"
  import { display_date } from "$lib/display_date"
  import { display_location } from "$lib/display_location"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  function format_end_date(end_date: Date | null) {
    if (!end_date) {
      return "Sin fecha de fin"
    }
    return display_date(end_date, { year: "numeric" })
  }

  const has_editable = $derived(
    data.contracts.some(
      (contract) =>
        contract.state === CONTRACT_STATE.EDITING,
    ),
  )
</script>

<Content.Root>
  <Content.Title>Contratos</Content.Title>
  <Content.Section>
    <Section.Header>
      <Section.Title>Contratos</Section.Title>
      <Section.Actions>
        <a href="/admin/contracts/new">
          <Button>Nuevo contrato</Button>
        </a>
      </Section.Actions>
    </Section.Header>
  </Content.Section>
  <Content.Section>
    <form
      method="POST"
      action={compose_action(ACTION.SET_STATE)}
      onchange={(event) => {
        event.currentTarget.requestSubmit()
      }}
    >
      <Content.Section>
        <Formulary.Field>
          <Formulary.Label for="state"
            >Estado</Formulary.Label
          >
          <Formulary.Select
            id="state"
            name="state"
            value={data.state}
          >
            {#each get_contract_states() as state}
              <option value={state}>
                {get_contract_state_label(state)}
              </option>
            {/each}
          </Formulary.Select>
        </Formulary.Field>
      </Content.Section>
    </form>
  </Content.Section>
  <Content.Section>
    <Table.Root>
      <Table.Header>
        <Table.Cell header>Propiedad</Table.Cell>
        <Table.Cell header>Fecha de fin</Table.Cell>
        {#if has_editable}
          <Table.Cell header>Acciones</Table.Cell>
        {/if}
      </Table.Header>
      <Table.Body>
        {#each data.contracts as contract (contract.id)}
          {@const is_editable =
            contract.state === CONTRACT_STATE.EDITING}
          <Table.Row>
            <Table.Cell
              >{display_location(
                contract.location,
              )}</Table.Cell
            >
            <Table.Cell
              >{format_end_date(
                contract.end_date,
              )}</Table.Cell
            >
            {#if has_editable}
              <Table.Cell>
                {#if is_editable}
                  <a
                    href={`/admin/properties/${contract.property_id}/contracts/${contract.id}/edit`}
                  >
                    <Button>Editar</Button>
                  </a>
                {/if}
              </Table.Cell>
            {/if}
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Content.Section>
</Content.Root>

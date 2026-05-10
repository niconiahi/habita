<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import {
    CONTRACT_TYPE,
    get_contract_type_label,
  } from "$lib/contract_type"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

{#snippet TypeSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>tipo</Section.Title>
    </Section.Header>
    <Formulary.Fields>
      <Formulary.Field>
        <Formulary.Label for="type"
          >tipo de contrato</Formulary.Label
        >
        <Formulary.Select
          id="type"
          name="type"
          required
          value={CONTRACT_TYPE.LONG_TERM}
        >
          {#each data.contract_types as type}
            <option value={type}
              >{get_contract_type_label(type)}</option
            >
          {/each}
        </Formulary.Select>
      </Formulary.Field>
    </Formulary.Fields>
  </Content.Section>
{/snippet}

{#snippet PriceSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>precio</Section.Title>
    </Section.Header>
    <Formulary.Fields>
      <Formulary.Field>
        <Formulary.Label for="price"
          >precio inicial</Formulary.Label
        >
        <input
          id="price"
          name="price"
          type="number"
          required
        />
      </Formulary.Field>
    </Formulary.Fields>
  </Content.Section>
{/snippet}

<Content.Root>
  <Content.Title>Creación de contrato</Content.Title>
  <Formulary.Root
    method="POST"
    action={compose_action(ACTION.CREATE_CONTRACT)}
  >
    {#snippet children({ submit_state })}
      {@render TypeSection()}
      {@render PriceSection()}
      <Formulary.Actions>
        <Button
          variant="primary"
          type="submit"
          disabled={submit_state === "busy"}
        >
          <Formulary.SubmitLabel
            state={submit_state}
            idle="Crear contrato"
            busy="Creando contrato..."
          done="Creado"
          />
        </Button>
      </Formulary.Actions>
    {/snippet}
  </Formulary.Root>
</Content.Root>

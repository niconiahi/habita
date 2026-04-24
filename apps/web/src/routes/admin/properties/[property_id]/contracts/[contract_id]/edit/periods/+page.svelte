<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "../actions/action"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()

  let errors = $derived(
    (form?.errors as any)?.create_pdf ?? {},
  )
</script>

<Content.Section>
  <Section.Header>
    <Section.Title>períodos</Section.Title>
  </Section.Header>
  {#if errors.periods}
    <span class="error">{errors.periods}</span>
  {/if}
  {#if data.contract.periods.length === 0}
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.CREATE_PERIOD)}
    >
      <Formulary.Fields>
        <Formulary.Field>
          <Formulary.Label for="price"
            >precio inicial</Formulary.Label
          >
          <input id="price" name="price" type="number" />
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button variant="primary" type="submit"
          >Crear período</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  {:else}
    <ul class="period-list">
      {#each data.contract.periods as period, index (period.id)}
        {#if index === 0}
          <li>
            <Formulary.Root
              method="POST"
              action={compose_action(ACTION.UPDATE_PERIOD)}
            >
              <Formulary.Fields>
                <input
                  type="hidden"
                  value={period.id}
                  name="id"
                />
                <Formulary.Field>
                  <Formulary.Label for="price"
                    >inicial</Formulary.Label
                  >
                  <input
                    id="price"
                    name="price"
                    type="number"
                    value={period.price}
                  />
                </Formulary.Field>
              </Formulary.Fields>
              <Formulary.Actions>
                <Button variant="primary" type="submit"
                  >Guardar precio</Button
                >
              </Formulary.Actions>
            </Formulary.Root>
          </li>
        {:else}
          <li class="period-item">
            <span>${period.price}</span>
          </li>
        {/if}
      {/each}
    </ul>
  {/if}
</Content.Section>

<style>
  .error {
    color: rgb(239 68 68);
  }

  .period-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .period-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
</style>

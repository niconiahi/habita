<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import LocationInput from "$lib/components/LocationInput.svelte"
  import {
    get_property_type_label,
    PROPERTY_TYPE,
    type PropertyType,
  } from "$lib/property_type"
  import { get_property_destiny_label } from "$lib/property_destiny"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
  let property_type = $state<PropertyType>(
    PROPERTY_TYPE.DEPARTMENT,
  )
  function handle_type_change(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    property_type = Number(target.value) as PropertyType
  }
</script>

{#snippet Location()}
  <section>
    <Section.Header>
      <Section.Title>ubicación</Section.Title>
    </Section.Header>
    <LocationInput />
  </section>
{/snippet}

{#snippet Characteristics()}
  <section>
    <Section.Header>
      <Section.Title>características</Section.Title>
    </Section.Header>
    <Formulary.Fields>
      <Formulary.Field>
        <Formulary.Label for="type">tipo</Formulary.Label>
        <Formulary.Select
          name="type"
          id="type"
          required
          onchange={handle_type_change}
        >
          {#each data.property_types as type}
            <option value={type}
              >{get_property_type_label(type)}</option
            >
          {/each}
        </Formulary.Select>
      </Formulary.Field>
      {#if property_type === PROPERTY_TYPE.DEPARTMENT}
        <Formulary.Field>
          <Formulary.Label for="unit"
            >unidad</Formulary.Label
          >
          <input
            placeholder="ej. 9A o 4011"
            required
            name="unit"
            id="unit"
            type="text"
          />
        </Formulary.Field>
      {/if}
    </Formulary.Fields>
  </section>
{/snippet}

{#snippet Destiny()}
  <section>
    <Section.Header>
      <Section.Title>destino</Section.Title>
    </Section.Header>
    <fieldset class="checkbox-list">
      {#each data.property_destinies as destiny}
        <label class="checkbox-label">
          <input
            type="checkbox"
            name="destiny"
            value={destiny}
          />
          {get_property_destiny_label(destiny)}
        </label>
      {/each}
    </fieldset>
  </section>
{/snippet}

<Content.Root>
  <Content.Title>Creación de propiedad</Content.Title>
  <Content.Section>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.CREATE_PROPERTY)}
    >
      <Formulary.Fields>
        {@render Location()}
        {@render Characteristics()}
        {@render Destiny()}
      </Formulary.Fields>
      <Formulary.Actions>
        <Button variant="primary" type="submit">Crear propiedad</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
</Content.Root>

<style>
  .checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>

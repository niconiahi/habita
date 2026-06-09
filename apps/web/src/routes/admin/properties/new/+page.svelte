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
  import { create_property } from "./forms/create_property.remote"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
  let property_type = $state<PropertyType>(
    PROPERTY_TYPE.DEPARTMENT,
  )

  function handle_type_change(event: Event) {
    const target = event.currentTarget as HTMLSelectElement
    property_type = Number(target.value) as PropertyType
  }

  function destiny_attrs(destiny: number) {
    return (
      create_property.fields.destiny as unknown as {
        as: (
          type: "checkbox",
          value: string,
        ) => Record<string, unknown>
      }
    ).as("checkbox", String(destiny))
  }
</script>

{#snippet errors(issues: { message: string }[] | undefined)}
  {#if issues}
    {#each issues as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  {/if}
{/snippet}

{#snippet Location()}
  <section>
    <Section.Header>
      <Section.Title>ubicación</Section.Title>
    </Section.Header>
    <LocationInput />
    {@render errors(create_property.fields.location.issues())}
  </section>
{/snippet}

{#snippet Characteristics()}
  <section>
    <Section.Header>
      <Section.Title>características</Section.Title>
    </Section.Header>
    <div class="form-fields">
      <div class="form-field">
        <label for="type">tipo</label>
        <select
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
        </select>
        {@render errors(create_property.fields.type.issues())}
      </div>
      {#if property_type === PROPERTY_TYPE.DEPARTMENT}
        <div class="form-field">
          <label for="unit">unidad</label>
          <input
            placeholder="ej. 9A o 4011"
            required
            name="unit"
            id="unit"
            type="text"
          />
          {@render errors(
            create_property.fields.unit.issues(),
          )}
        </div>
      {/if}
    </div>
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
          <input {...destiny_attrs(destiny)} />
          {get_property_destiny_label(destiny)}
        </label>
      {/each}
    </fieldset>
    {@render errors(create_property.fields.destiny.issues())}
  </section>
{/snippet}

<Content.Root>
  <Content.Title>Creación de propiedad</Content.Title>
  <Content.Section>
    <form
      {...create_property.enhance(async ({ submit }) => {
        await submit()
      })}
    >
      {@render Location()}
      {@render Characteristics()}
      {@render Destiny()}
      <div class="form-actions">
        <Formulary.Submission form={create_property}>
          {#snippet children({ is_busy, is_done })}
            <Button
              variant="primary"
              type="submit"
              disabled={is_busy()}
            >
              <Formulary.SubmissionLabel
                is_busy={is_busy()}
                is_done={is_done()}
                idle="Crear propiedad"
                busy="Creando propiedad..."
                done="Creado"
              />
            </Button>
          {/snippet}
        </Formulary.Submission>
      </div>
    </form>
  </Content.Section>
</Content.Root>

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

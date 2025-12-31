<script lang="ts">
  import * as v from "valibot"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import {
    ContractFileTypeSchema,
    get_contract_file_type_label,
  } from "$lib/contract_file_type"
  import { COURT, get_court_label } from "$lib/court"
  import { format_date_for_input } from "$lib/date"
  import {
    DURATIONS,
    get_duration_label,
  } from "$lib/duration"
  import {
    ESCALATION_TYPE,
    get_escalation_label,
  } from "$lib/escalation_type"
  import { get_property_destiny_label } from "$lib/property_destiny"
  import type { PageData } from "./$types"
  import { ACTION } from "./actions/action"
  import { compose_action } from "$lib/compose_action"

  let { data }: { data: PageData } = $props()

  let file_input: HTMLInputElement
  let file_form: HTMLFormElement

  function handle_add_click() {
    file_input?.click()
  }

  function handle_file_change() {
    file_form?.requestSubmit()
  }
</script>

{#snippet SectionTwo()}
  <Content.Section>
    <Section.Header>
      <Section.Title>sección 2: estado</Section.Title>
    </Section.Header>
    <p class="text-gray-500 text-sm">
      Inventario pendiente de implementación
    </p>
  </Content.Section>
{/snippet}

{#snippet SectionThree()}
  <Content.Section>
    <Section.Header>
      <Section.Title>sección 3: destino</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_CONTRACT)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="id"
        />
        <Formulary.Field>
          <span class="font-medium">Tipo</span>
          {#each data.property.destinies as destiny}
            <label class="flex items-center gap-2">
              <input
                type="radio"
                id="destiny"
                name="destiny"
                value={destiny}
                checked={data.contract.destiny === destiny}
              />
              {get_property_destiny_label(destiny)}
            </label>
          {/each}
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar destino</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet SectionSix()}
  <Content.Section>
    <Section.Header>
      <Section.Title>sección 6: plazo</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_CONTRACT)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="id"
        />
        <Formulary.Field>
          <Formulary.Label for="start_date"
            >fecha de inicio</Formulary.Label
          >
          <input
            id="start_date"
            name="start_date"
            type="datetime-local"
            value={data.contract.start_date
              ? format_date_for_input(
                  data.contract.start_date,
                )
              : ""}
          />
        </Formulary.Field>
        <Formulary.Field>
          <Formulary.Label for="end_date"
            >fecha de finalización</Formulary.Label
          >
          <input
            id="end_date"
            name="end_date"
            type="datetime-local"
            value={data.contract.end_date
              ? format_date_for_input(
                  data.contract.end_date,
                )
              : ""}
          />
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar plazo</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet SectionSeven()}
  <Content.Section>
    <Section.Header>
      <Section.Title
        >sección 7: canon locativo</Section.Title
      >
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_CONTRACT)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="id"
        />
        <Formulary.Field>
          <Formulary.Label for="escalation_type"
            >tipo</Formulary.Label
          >
          <Formulary.Select
            name="escalation_type"
            id="escalation_type"
            value={data.contract.escalation_type ?? ""}
          >
            {#each Object.values(ESCALATION_TYPE) as type}
              <option value={type}
                >{get_escalation_label(type)}</option
              >
            {/each}
          </Formulary.Select>
        </Formulary.Field>
        <Formulary.Field>
          <Formulary.Label for="escalation_duration"
            >cada</Formulary.Label
          >
          <Formulary.Select
            name="escalation_duration"
            id="escalation_duration"
            value={data.contract.escalation_duration ?? ""}
          >
            {#each DURATIONS as duration}
              <option value={duration}
                >{get_duration_label(duration)}</option
              >
            {/each}
          </Formulary.Select>
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar valores</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet SectionEight()}
  <Content.Section>
    <Section.Header>
      <Section.Title>sección 8: forma de pago</Section.Title
      >
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_CONTRACT)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="id"
        />
        <Formulary.Field>
          <Formulary.Label for="cbu">cbu</Formulary.Label>
          <input
            id="cbu"
            name="cbu"
            type="text"
            value={data.contract.cbu ?? ""}
          />
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar CBU</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet SectionNine()}
  <Content.Section>
    <Section.Header>
      <Section.Title>sección 9: mora</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_CONTRACT)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="id"
        />
        <Formulary.Field>
          <Formulary.Label for="fine_percentage"
            >porcentaje</Formulary.Label
          >
          <input
            id="fine_percentage"
            name="fine_percentage"
            type="number"
            value={data.contract.fine_amount ?? ""}
          />
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar porcentaje</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet SectionFourteen()}
  <Content.Section>
    <Section.Header>
      <Section.Title>sección 14: devoluciones</Section.Title
      >
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_CONTRACT)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="id"
        />
        <Formulary.Field>
          <Formulary.Label for="percentage_return"
            >porcentaje</Formulary.Label
          >
          <input
            id="percentage_return"
            name="percentage_return"
            type="number"
            value={data.contract.percentage_return ?? ""}
          />
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar porcentaje</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet SectionFifteen()}
  <Content.Section>
    <Section.Header>
      <Section.Title
        >sección 15: recesión anticipada</Section.Title
      >
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_CONTRACT)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="id"
        />
        <Formulary.Field>
          <Formulary.Label for="early_termination"
            >descripción</Formulary.Label
          >
          <textarea
            id="early_termination"
            name="early_termination"
            rows="4"
            >{data.contract.early_termination ??
              ""}</textarea
          >
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit"
          >Guardar recesión anticipada</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet SectionSixteen()}
  <Content.Section>
    <Section.Header>
      <Section.Title
        >sección 16: muestra de propiedad</Section.Title
      >
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_CONTRACT)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="id"
        />
        <Formulary.Field>
          <Formulary.Label for="showroom_hours"
            >cantidad de horas</Formulary.Label
          >
          <input
            id="showroom_hours"
            name="showroom_hours"
            type="number"
            value={data.contract.showroom_hours ?? ""}
          />
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar cantidad</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet SectionTwentyOne()}
  <Content.Section>
    <Section.Header>
      <Section.Title>sección 21: jurisdicción</Section.Title
      >
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_CONTRACT)}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="id"
        />
        <Formulary.Field>
          <Formulary.Label for="court_id"
            >tribunal</Formulary.Label
          >
          <Formulary.Select
            name="court_id"
            id="court_id"
            value={data.contract.court_id ?? ""}
          >
            {#each Object.values(COURT) as type}
              <option value={type}
                >{get_court_label(type)}</option
              >
            {/each}
          </Formulary.Select>
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Guardar jurisdicción</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet DocumentsSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>documentos</Section.Title>
      <Section.Actions>
        <Button type="button" onclick={handle_add_click}>
          Agregar documento
        </Button>
        <form
          method="POST"
          action={compose_action(ACTION.CREATE_PDF)}
        >
          <input
            type="hidden"
            value={data.contract.id}
            name="id"
          />
          <Button type="submit">Generar contrato</Button>
        </form>
      </Section.Actions>
    </Section.Header>
    <form
      bind:this={file_form}
      method="POST"
      action={compose_action(ACTION.CREATE_FILE)}
      enctype="multipart/form-data"
      class="mb-4"
    >
      <input
        type="hidden"
        value={data.contract.id}
        name="contract_id"
      />
      <input
        bind:this={file_input}
        type="file"
        name="file"
        class="sr-only"
        onchange={handle_file_change}
      />
      <Formulary.Field>
        <Formulary.Label for="file_type"
          >tipo</Formulary.Label
        >
        <Formulary.Select
          name="file_type"
          id="file_type"
          required
        >
          {#each data.contract_file_types as type}
            <option value={type}
              >{get_contract_file_type_label(type)}</option
            >
          {/each}
        </Formulary.Select>
      </Formulary.Field>
    </form>
    <ul class="flex flex-col gap-2">
      {#each data.contract.files as file (file.id)}
        {@const contract_type = v.parse(
          ContractFileTypeSchema,
          file.type,
        )}
        <li class="flex items-center gap-4">
          <span class="font-bold"
            >{get_contract_file_type_label(
              contract_type,
            )}</span
          >
          <a
            href="/files/{file.id}"
            class="text-blue-500 underline"
            >{file.basename}</a
          >
          <form
            method="POST"
            action={compose_action(ACTION.DESTROY_FILE)}
          >
            <input
              type="hidden"
              value={file.id}
              name="id"
            />
            <input
              type="hidden"
              value={data.contract.id}
              name="contract_id"
            />
            <Button type="submit">Eliminar</Button>
          </form>
        </li>
      {/each}
    </ul>
  </Content.Section>
{/snippet}

{#snippet PeriodsSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>períodos</Section.Title>
    </Section.Header>
    <ul class="flex flex-col gap-2">
      {#each data.contract.periods as period, index (period.id)}
        <li class="flex items-center gap-4">
          {#if index === 0}
            <span class="font-bold">inicial</span>
          {/if}
          <span>${period.price}</span>
        </li>
      {/each}
    </ul>
  </Content.Section>
{/snippet}

<Content.Root>
  <Content.Title>Edición de contrato</Content.Title>
  {@render SectionTwo()}
  {@render SectionThree()}
  {@render SectionSix()}
  {@render SectionSeven()}
  {@render SectionEight()}
  {@render SectionNine()}
  {@render SectionFourteen()}
  {@render SectionFifteen()}
  {@render SectionSixteen()}
  {@render SectionTwentyOne()}
  {@render DocumentsSection()}
  {@render PeriodsSection()}
</Content.Root>

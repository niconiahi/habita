<script lang="ts">
  import { enhance } from "$app/forms"
  import * as v from "valibot"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import TypedFileUploadButton from "$lib/components/TypedFileUploadButton.svelte"
  import { display_name } from "$lib/display_name"
  import {
    ContractFileTypeSchema,
    get_contract_file_type_label,
  } from "$lib/contract_file_type"
  import {
    CONTRACT_ITEM_STATE,
    get_contract_item_state_label,
  } from "$lib/contract_item_state"
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
  import type { ActionData, PageData } from "./$types"
  import { ACTION } from "./actions/action"
  import { compose_action } from "$lib/compose_action"
  let { data, form }: { data: PageData; form: ActionData } =
    $props()
  let errors = $derived(form?.errors?.create_pdf ?? {})

  const document_types = $derived(
    data.contract_file_types.map((type) => ({
      value: type,
      label: get_contract_file_type_label(type),
    })),
  )

  let contract_item_file_inputs: Record<
    number,
    HTMLInputElement
  > = $state({})
  let contract_item_file_forms: Record<
    number,
    HTMLFormElement
  > = $state({})

  function handle_contract_item_file_click(
    contract_item_id: number,
  ) {
    contract_item_file_inputs[contract_item_id]?.click()
  }

  function handle_contract_item_file_change(
    contract_item_id: number,
  ) {
    contract_item_file_forms[
      contract_item_id
    ]?.requestSubmit()
  }
</script>

{#snippet SectionTwo()}
  <Content.Section>
    <Section.Header>
      <Section.Title>sección 2: estado</Section.Title>
      <Section.Actions>
        <form
          method="POST"
          action={compose_action(
            ACTION.CREATE_CONTRACT_ITEM,
          )}
          use:enhance
        >
          <Button type="submit">Agregar item</Button>
        </form>
      </Section.Actions>
    </Section.Header>
    <ul class="flex flex-col gap-6">
      {#each data.contract.contract_items as contract_item (contract_item.id)}
        <li class="border border-gray-700 p-4 rounded">
          <Formulary.Root method="POST">
            <Formulary.Fields>
              <input
                type="hidden"
                value={contract_item.id}
                name="id"
              />
              <Formulary.Field>
                <Formulary.Label
                  for={`name_${contract_item.id}`}
                  >nombre</Formulary.Label
                >
                <input
                  id={`name_${contract_item.id}`}
                  type="text"
                  name="name"
                  value={contract_item.name}
                />
              </Formulary.Field>
              <Formulary.Field>
                <Formulary.Label
                  for={`state_${contract_item.id}`}
                  >estado</Formulary.Label
                >
                <Formulary.Select
                  name="state"
                  id={`state_${contract_item.id}`}
                  value={contract_item.state}
                >
                  {#each Object.values(CONTRACT_ITEM_STATE) as state}
                    <option value={state}
                      >{get_contract_item_state_label(
                        state,
                      )}</option
                    >
                  {/each}
                </Formulary.Select>
              </Formulary.Field>
            </Formulary.Fields>
            <Formulary.Actions>
              <Button
                type="submit"
                formaction={compose_action(
                  ACTION.UPDATE_CONTRACT_ITEM,
                )}>Guardar item</Button
              >
              <Button
                type="submit"
                formaction={compose_action(
                  ACTION.DESTROY_CONTRACT_ITEM,
                )}>Eliminar item</Button
              >
            </Formulary.Actions>
          </Formulary.Root>
          <div class="mt-4">
            <div
              class="flex items-center justify-between mb-2"
            >
              <span class="text-sm text-gray-400"
                >Fotos</span
              >
              <Button
                type="button"
                onclick={() =>
                  handle_contract_item_file_click(
                    contract_item.id,
                  )}>Agregar foto</Button
              >
            </div>
            <ul class="grid grid-cols-2 gap-2">
              {#each contract_item.files as file (`contract_item_file_${file.id}`)}
                <li class="relative">
                  <img
                    class="w-sm aspect-video object-cover block rounded"
                    alt="Foto del item"
                    src={`data:image/webp;base64,${file.content}`}
                  />
                  <form
                    method="POST"
                    action={compose_action(
                      ACTION.DESTROY_CONTRACT_ITEM_FILE,
                    )}
                    class="absolute top-1 left-1 bg-gray-300"
                    use:enhance
                  >
                    <input
                      type="hidden"
                      value={file.id}
                      name="id"
                    />
                    <input
                      type="hidden"
                      value={contract_item.id}
                      name="contract_item_id"
                    />
                    <Button type="submit">X</Button>
                  </form>
                </li>
              {/each}
            </ul>
            <form
              bind:this={
                contract_item_file_forms[contract_item.id]
              }
              method="POST"
              action={compose_action(
                ACTION.CREATE_CONTRACT_ITEM_FILE,
              )}
              enctype="multipart/form-data"
              class="contents"
              use:enhance
            >
              <input
                type="hidden"
                value={contract_item.id}
                name="contract_item_id"
              />
              <input
                bind:this={
                  contract_item_file_inputs[
                    contract_item.id
                  ]
                }
                type="file"
                name="file"
                accept="image/*"
                class="sr-only"
                onchange={() =>
                  handle_contract_item_file_change(
                    contract_item.id,
                  )}
              />
            </form>
          </div>
        </li>
      {/each}
    </ul>
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
          {#if errors.start_date}
            <span class="text-red-500"
              >{errors.start_date}</span
            >
          {/if}
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
          {#if errors.end_date}
            <span class="text-red-500"
              >{errors.end_date}</span
            >
          {/if}
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
          {#if errors.escalation_type}
            <span class="text-red-500"
              >{errors.escalation_type}</span
            >
          {/if}
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
          {#if errors.escalation_duration}
            <span class="text-red-500"
              >{errors.escalation_duration}</span
            >
          {/if}
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
          {#if errors.fine_amount}
            <span class="text-red-500"
              >{errors.fine_amount}</span
            >
          {/if}
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

{#snippet ActionsSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>acciones</Section.Title>
      <Section.Actions>
        <form
          method="POST"
          action={compose_action(ACTION.CREATE_PDF)}
          use:enhance
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
  </Content.Section>
{/snippet}

{#snippet DocumentsSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>documentos</Section.Title>
      <Section.Actions>
        <TypedFileUploadButton
          types={document_types}
          label="Agregar documento"
          action={compose_action(ACTION.CREATE_FILE)}
          type_name="file_type"
          data={{ contract_id: data.contract.id }}
        />
      </Section.Actions>
    </Section.Header>
    {#if errors.property_road || errors.property_house_number || errors.property_state || errors.property_unit}
      <div class="mb-4 space-y-1">
        <p class="text-sm font-medium text-red-500">
          Errores de propiedad:
        </p>
        {#if errors.property_road}
          <span class="text-red-500 block"
            >{errors.property_road}</span
          >
        {/if}
        {#if errors.property_house_number}
          <span class="text-red-500 block"
            >{errors.property_house_number}</span
          >
        {/if}
        {#if errors.property_state}
          <span class="text-red-500 block"
            >{errors.property_state}</span
          >
        {/if}
        {#if errors.property_unit}
          <span class="text-red-500 block"
            >{errors.property_unit}</span
          >
        {/if}
      </div>
    {/if}
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
            target="_blank"
            href="/files/{file.id}"
            class="text-blue-500 underline"
            >{file.basename}</a
          >
          <form
            method="POST"
            action={compose_action(ACTION.DESTROY_FILE)}
            use:enhance
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
    {#if errors.periods}
      <span class="text-red-500">{errors.periods}</span>
    {/if}
    <ul class="flex flex-col gap-4">
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
                <Button type="submit">Guardar precio</Button
                >
              </Formulary.Actions>
            </Formulary.Root>
          </li>
        {:else}
          <li class="flex items-center gap-4">
            <span>${period.price}</span>
          </li>
        {/if}
      {/each}
    </ul>
  </Content.Section>
{/snippet}

{#snippet TenantSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>inquilino</Section.Title>
    </Section.Header>
    {#if errors.tenant}
      <span class="text-red-500">{errors.tenant}</span>
    {/if}
    {#if data.tenant}
      <div class="space-y-2">
        <div class="space-y-1">
          <p class="text-sm text-gray-500">Nombre</p>
          <p>{display_name(data.tenant)}</p>
          {#if errors.tenant_name}
            <span class="text-red-500"
              >{errors.tenant_name}</span
            >
          {/if}
          {#if errors.tenant_surname}
            <span class="text-red-500"
              >{errors.tenant_surname}</span
            >
          {/if}
        </div>
        <div class="space-y-1">
          <p class="text-sm text-gray-500">Email</p>
          <p>{data.tenant.email}</p>
          {#if errors.tenant_email}
            <span class="text-red-500"
              >{errors.tenant_email}</span
            >
          {/if}
        </div>
        <div class="space-y-1">
          <p class="text-sm text-gray-500">Teléfono</p>
          <p>{data.tenant.phone_number ?? "-"}</p>
          {#if errors.tenant_phone_number}
            <span class="text-red-500"
              >{errors.tenant_phone_number}</span
            >
          {/if}
        </div>
        <div class="space-y-1">
          <p class="text-sm text-gray-500">DNI</p>
          <p>{data.tenant.document_number ?? "-"}</p>
          {#if errors.tenant_document_number}
            <span class="text-red-500"
              >{errors.tenant_document_number}</span
            >
          {/if}
        </div>
      </div>
    {:else}
      <p class="text-gray-500 text-sm">
        Sin inquilino asignado
      </p>
      <a href="/admin/candidates" class="inline-block mt-2">
        <Button>Agregar inquilino</Button>
      </a>
    {/if}
  </Content.Section>
{/snippet}
{#snippet LandlordSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>propietario</Section.Title>
    </Section.Header>
    {#if errors.landlord}
      <span class="text-red-500">{errors.landlord}</span>
    {/if}
    {#if data.landlord}
      <div class="space-y-2">
        <div class="space-y-1">
          <p class="text-sm text-gray-500">Nombre</p>
          <p>{display_name(data.landlord)}</p>
          {#if errors.landlord_name}
            <span class="text-red-500"
              >{errors.landlord_name}</span
            >
          {/if}
          {#if errors.landlord_surname}
            <span class="text-red-500"
              >{errors.landlord_surname}</span
            >
          {/if}
        </div>
        <div class="space-y-1">
          <p class="text-sm text-gray-500">Email</p>
          <p>{data.landlord.email}</p>
          {#if errors.landlord_email}
            <span class="text-red-500"
              >{errors.landlord_email}</span
            >
          {/if}
        </div>
        <div class="space-y-1">
          <p class="text-sm text-gray-500">Teléfono</p>
          <p>{data.landlord.phone_number ?? "-"}</p>
          {#if errors.landlord_phone_number}
            <span class="text-red-500"
              >{errors.landlord_phone_number}</span
            >
          {/if}
        </div>
        <div class="space-y-1">
          <p class="text-sm text-gray-500">DNI</p>
          <p>{data.landlord.document_number ?? "-"}</p>
          {#if errors.landlord_document_number}
            <span class="text-red-500"
              >{errors.landlord_document_number}</span
            >
          {/if}
        </div>
      </div>
    {:else}
      <p class="text-gray-500 text-sm">
        Sin propietario asignado
      </p>
      <a
        href="/admin/properties/{data.property
          .id}/edit#members"
        class="inline-block mt-2"
      >
        <Button>Agregar propietario</Button>
      </a>
    {/if}
  </Content.Section>
{/snippet}
<Content.Root>
  <Content.Title>Edición de contrato</Content.Title>
  <p class="text-sm text-gray-400">
    Propiedad:
    <a
      href="/admin/properties/{data.property.id}/edit"
      class="text-blue-500 underline"
    >
      {data.property.location?.road ?? "Sin calle"}
      {data.property.location?.house_number ?? ""}
    </a>
  </p>
  {@render LandlordSection()}
  {@render TenantSection()}
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
  {@render ActionsSection()}
  {@render DocumentsSection()}
  {@render PeriodsSection()}
</Content.Root>

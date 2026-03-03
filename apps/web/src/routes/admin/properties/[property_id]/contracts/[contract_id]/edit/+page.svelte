<script lang="ts">
  import { untrack } from "svelte"
  import { enhance } from "$app/forms"
  import * as v from "valibot"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import TypedFileUploadButton from "$lib/components/TypedFileUploadButton.svelte"
  import { display_name } from "$lib/display_name"
  import {
    SIGNATURE_STATUS,
    get_signature_status_label,
  } from "$lib/signature_status"
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
  import {
    WARRANTY_TYPE,
    get_warranty_type_label,
  } from "$lib/warranty_type"
  import LocationInput from "$lib/components/LocationInput.svelte"
  import { get_property_destiny_label } from "$lib/property_destiny"
  import type { ActionData, PageData } from "./$types"
  import { ACTION } from "./actions/action"
  import { compose_action } from "$lib/compose_action"
  let { data, form }: { data: PageData; form: ActionData } =
    $props()
  let errors = $derived(
    (form?.errors as any)?.create_pdf ?? {},
  )
  let warranty_errors = $derived(
    (form?.errors as any)?.create_warranty ?? {},
  )
  let cert_result = $derived(form as any)
  let has_contract_pdf = $derived(
    data.contract.files.some((f) => f.type === 0),
  )
  let has_signed_pdf = $derived(
    data.contract.files.some((f) => f.type === 2),
  )
  let both_signed = $derived(
    data.signature?.landlord_status ===
      SIGNATURE_STATUS.SIGNED &&
      data.signature?.tenant_status ===
        SIGNATURE_STATUS.SIGNED,
  )
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
  let selected_warranty_type = $state(
    untrack(() => data.warranty?.type ?? ""),
  )
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
    <ul class="item-list">
      {#each data.contract.contract_items as contract_item (contract_item.id)}
        <li class="item-card">
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
          <div class="photos-section">
            <div class="photos-header">
              <span class="photos-label">Fotos</span>
              <Button
                type="button"
                onclick={() =>
                  handle_contract_item_file_click(
                    contract_item.id,
                  )}>Agregar foto</Button
              >
            </div>
            <ul class="photos-grid">
              {#each contract_item.files as file (`contract_item_file_${file.id}`)}
                <li class="photo-item">
                  <img
                    class="photo"
                    alt="Foto del item"
                    src={`data:image/webp;base64,${file.content}`}
                  />
                  <form
                    method="POST"
                    action={compose_action(
                      ACTION.DESTROY_CONTRACT_ITEM_FILE,
                    )}
                    class="photo-delete"
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
              class="hidden-form"
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
          <span class="field-label">Tipo</span>
          {#each data.property.destinies as destiny}
            <label class="radio-label">
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
            <span class="error">{errors.start_date}</span>
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
            <span class="error">{errors.end_date}</span>
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
            <span class="error"
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
            <span class="error"
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
            <span class="error">{errors.fine_amount}</span>
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
            >días de preaviso</Formulary.Label
          >
          <input
            type="number"
            id="early_termination"
            name="early_termination"
            value={data.contract.early_termination ?? ""}
            min="0"
          />
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

{#snippet SectionSeventeen()}
  <Content.Section>
    <Section.Header>
      <Section.Title>sección 17: garantía</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(
        data.warranty
          ? ACTION.UPDATE_WARRANTY
          : ACTION.CREATE_WARRANTY,
      )}
    >
      <Formulary.Fields>
        <input
          type="hidden"
          value={data.contract.id}
          name="contract_id"
        />
        {#if data.warranty}
          <input
            type="hidden"
            value={data.warranty.id}
            name="warranty_id"
          />
        {/if}
        <Formulary.Field>
          <Formulary.Label for="warranty_type"
            >tipo de garantía</Formulary.Label
          >
          <Formulary.Select
            name="warranty_type"
            id="warranty_type"
            bind:value={selected_warranty_type}
          >
            <option value="">Seleccionar tipo</option>
            {#each Object.values(WARRANTY_TYPE) as type}
              <option value={type}
                >{get_warranty_type_label(type)}</option
              >
            {/each}
          </Formulary.Select>
          {#if warranty_errors.warranty_type}
            <span class="error"
              >{warranty_errors.warranty_type}</span
            >
          {/if}
        </Formulary.Field>
        {#if selected_warranty_type === WARRANTY_TYPE.PROPERTY}
          <Formulary.Field>
            <Formulary.Label for="guarantor_name"
              >nombre del garante</Formulary.Label
            >
            <input
              id="guarantor_name"
              name="guarantor_name"
              type="text"
              value={data.warranty?.property_warranty
                ?.guarantor_name ?? ""}
            />
            {#if warranty_errors.guarantor_name}
              <span class="error"
                >{warranty_errors.guarantor_name}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="guarantor_dni"
              >DNI del garante</Formulary.Label
            >
            <input
              id="guarantor_dni"
              name="guarantor_dni"
              type="text"
              value={data.warranty?.property_warranty
                ?.guarantor_dni ?? ""}
            />
            {#if warranty_errors.guarantor_dni}
              <span class="error"
                >{warranty_errors.guarantor_dni}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="guarantor_email"
              >email del garante</Formulary.Label
            >
            <input
              id="guarantor_email"
              name="guarantor_email"
              type="email"
              value={data.warranty?.property_warranty
                ?.guarantor_email ?? ""}
            />
            {#if warranty_errors.guarantor_email}
              <span class="error"
                >{warranty_errors.guarantor_email}</span
              >
            {/if}
          </Formulary.Field>
          <LocationInput
            default_value={data.warranty?.property_warranty
              ? `${data.warranty.property_warranty.road} ${data.warranty.property_warranty.house_number}`
              : ""}
            default_lat={data.warranty?.property_warranty
              ?.latitude ?? ""}
            default_lon={data.warranty?.property_warranty
              ?.longitude ?? ""}
          />
          {#if warranty_errors.location}
            <span class="error"
              >{warranty_errors.location}</span
            >
          {/if}
          <Formulary.Field>
            <Formulary.Label for="cadastral_district"
              >circunscripción</Formulary.Label
            >
            <input
              id="cadastral_district"
              name="cadastral_district"
              type="text"
              value={data.warranty?.property_warranty
                ?.cadastral_district ?? ""}
            />
            {#if warranty_errors.cadastral_district}
              <span class="error"
                >{warranty_errors.cadastral_district}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="cadastral_section"
              >sección</Formulary.Label
            >
            <input
              id="cadastral_section"
              name="cadastral_section"
              type="text"
              value={data.warranty?.property_warranty
                ?.cadastral_section ?? ""}
            />
            {#if warranty_errors.cadastral_section}
              <span class="error"
                >{warranty_errors.cadastral_section}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="cadastral_block"
              >manzana</Formulary.Label
            >
            <input
              id="cadastral_block"
              name="cadastral_block"
              type="text"
              value={data.warranty?.property_warranty
                ?.cadastral_block ?? ""}
            />
            {#if warranty_errors.cadastral_block}
              <span class="error"
                >{warranty_errors.cadastral_block}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="cadastral_parcel"
              >parcela</Formulary.Label
            >
            <input
              id="cadastral_parcel"
              name="cadastral_parcel"
              type="text"
              value={data.warranty?.property_warranty
                ?.cadastral_parcel ?? ""}
            />
            {#if warranty_errors.cadastral_parcel}
              <span class="error"
                >{warranty_errors.cadastral_parcel}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="property_tax_id"
              >partida inmobiliaria</Formulary.Label
            >
            <input
              id="property_tax_id"
              name="property_tax_id"
              type="text"
              value={data.warranty?.property_warranty
                ?.property_tax_id ?? ""}
            />
            {#if warranty_errors.property_tax_id}
              <span class="error"
                >{warranty_errors.property_tax_id}</span
              >
            {/if}
          </Formulary.Field>
        {:else if selected_warranty_type === WARRANTY_TYPE.SURETY}
          <Formulary.Field>
            <Formulary.Label for="guarantor_name"
              >nombre del garante</Formulary.Label
            >
            <input
              id="guarantor_name"
              name="guarantor_name"
              type="text"
              value={data.warranty?.surety_warranty
                ?.guarantor_name ?? ""}
            />
            {#if warranty_errors.guarantor_name}
              <span class="error"
                >{warranty_errors.guarantor_name}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="guarantor_dni"
              >DNI del garante</Formulary.Label
            >
            <input
              id="guarantor_dni"
              name="guarantor_dni"
              type="text"
              value={data.warranty?.surety_warranty
                ?.guarantor_dni ?? ""}
            />
            {#if warranty_errors.guarantor_dni}
              <span class="error"
                >{warranty_errors.guarantor_dni}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="guarantor_email"
              >email del garante</Formulary.Label
            >
            <input
              id="guarantor_email"
              name="guarantor_email"
              type="email"
              value={data.warranty?.surety_warranty
                ?.guarantor_email ?? ""}
            />
            {#if warranty_errors.guarantor_email}
              <span class="error"
                >{warranty_errors.guarantor_email}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="company_name"
              >nombre de la aseguradora</Formulary.Label
            >
            <input
              id="company_name"
              name="company_name"
              type="text"
              value={data.warranty?.surety_warranty
                ?.company_name ?? ""}
            />
            {#if warranty_errors.company_name}
              <span class="error"
                >{warranty_errors.company_name}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="policy_number"
              >número de póliza</Formulary.Label
            >
            <input
              id="policy_number"
              name="policy_number"
              type="text"
              value={data.warranty?.surety_warranty
                ?.policy_number ?? ""}
            />
            {#if warranty_errors.policy_number}
              <span class="error"
                >{warranty_errors.policy_number}</span
              >
            {/if}
          </Formulary.Field>
          <Formulary.Field>
            <Formulary.Label for="company_email"
              >email de la aseguradora</Formulary.Label
            >
            <input
              id="company_email"
              name="company_email"
              type="email"
              value={data.warranty?.surety_warranty
                ?.company_email ?? ""}
            />
            {#if warranty_errors.company_email}
              <span class="error"
                >{warranty_errors.company_email}</span
              >
            {/if}
          </Formulary.Field>
        {:else if selected_warranty_type === WARRANTY_TYPE.INCOME}
          <p class="hint">Guardar para agregar garantes</p>
        {/if}
      </Formulary.Fields>
      {#if selected_warranty_type}
        <Formulary.Actions>
          <Button type="submit"
            >{data.warranty ? "Guardar" : "Crear"} garantía</Button
          >
        </Formulary.Actions>
      {/if}
    </Formulary.Root>
    {#if selected_warranty_type === WARRANTY_TYPE.INCOME && data.warranty?.income_warranty}
      <div class="guarantors-section">
        <div class="guarantors-header">
          <span class="field-label">Garantes</span>
        </div>
        <ul class="guarantor-list">
          {#each data.warranty.income_warranty.guarantors as guarantor (guarantor.id)}
            <li class="item-card">
              <Formulary.Root
                method="POST"
                action={compose_action(
                  ACTION.UPDATE_INCOME_GUARANTOR,
                )}
              >
                <Formulary.Fields>
                  <input
                    type="hidden"
                    value={guarantor.id}
                    name="id"
                  />
                  <Formulary.Field>
                    <Formulary.Label
                      for={`guarantor_name_${guarantor.id}`}
                      >nombre</Formulary.Label
                    >
                    <input
                      id={`guarantor_name_${guarantor.id}`}
                      name="guarantor_name"
                      type="text"
                      value={guarantor.guarantor_name}
                    />
                  </Formulary.Field>
                  <Formulary.Field>
                    <Formulary.Label
                      for={`guarantor_dni_${guarantor.id}`}
                      >DNI</Formulary.Label
                    >
                    <input
                      id={`guarantor_dni_${guarantor.id}`}
                      name="guarantor_dni"
                      type="text"
                      value={guarantor.guarantor_dni}
                    />
                  </Formulary.Field>
                  <Formulary.Field>
                    <Formulary.Label
                      for={`guarantor_email_${guarantor.id}`}
                      >email</Formulary.Label
                    >
                    <input
                      id={`guarantor_email_${guarantor.id}`}
                      name="guarantor_email"
                      type="email"
                      value={guarantor.guarantor_email}
                    />
                  </Formulary.Field>
                </Formulary.Fields>
                <Formulary.Actions>
                  <Button type="submit">Guardar</Button>
                  <Button
                    type="submit"
                    formaction={compose_action(
                      ACTION.DESTROY_INCOME_GUARANTOR,
                    )}>Eliminar</Button
                  >
                </Formulary.Actions>
              </Formulary.Root>
            </li>
          {/each}
        </ul>
        <Formulary.Root
          method="POST"
          action={compose_action(
            ACTION.ADD_INCOME_GUARANTOR,
          )}
        >
          <Formulary.Fields>
            <input
              type="hidden"
              value={data.warranty.id}
              name="warranty_id"
            />
            <Formulary.Field>
              <Formulary.Label for="new_guarantor_name"
                >nombre del nuevo garante</Formulary.Label
              >
              <input
                id="new_guarantor_name"
                name="guarantor_name"
                type="text"
              />
            </Formulary.Field>
            <Formulary.Field>
              <Formulary.Label for="new_guarantor_dni"
                >DNI</Formulary.Label
              >
              <input
                id="new_guarantor_dni"
                name="guarantor_dni"
                type="text"
              />
            </Formulary.Field>
            <Formulary.Field>
              <Formulary.Label for="new_guarantor_email"
                >email</Formulary.Label
              >
              <input
                id="new_guarantor_email"
                name="guarantor_email"
                type="email"
              />
            </Formulary.Field>
          </Formulary.Fields>
          <Formulary.Actions>
            <Button type="submit">Agregar garante</Button>
          </Formulary.Actions>
        </Formulary.Root>
      </div>
    {/if}
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

{#snippet SigningSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>firma digital</Section.Title>
    </Section.Header>
    {#if has_signed_pdf && both_signed}
      <div class="signing-success">
        <p class="signing-success-text">Contrato firmado</p>
      </div>
    {:else if data.signature}
      <div class="signing-status">
        <div class="signing-party">
          <p class="info-block-label">Locador</p>
          <p>
            {get_signature_status_label(
              data.signature.landlord_status,
            )}
          </p>
          {#if data.signature.landlord_url && data.signature.landlord_status === SIGNATURE_STATUS.PENDING}
            <a
              href={data.signature.landlord_url}
              target="_blank"
              class="file-link">Enlace de firma</a
            >
          {/if}
          <form
            method="POST"
            action={compose_action(ACTION.START_ONBOARDING)}
            use:enhance
          >
            <input
              type="hidden"
              name="party"
              value="landlord"
            />
            <Button type="submit">Iniciar onboarding</Button
            >
          </form>
        </div>
        <div class="signing-party">
          <p class="info-block-label">Locatario</p>
          <p>
            {get_signature_status_label(
              data.signature.tenant_status,
            )}
          </p>
          {#if data.signature.tenant_url && data.signature.tenant_status === SIGNATURE_STATUS.PENDING}
            <a
              href={data.signature.tenant_url}
              target="_blank"
              class="file-link">Enlace de firma</a
            >
          {/if}
          <form
            method="POST"
            action={compose_action(ACTION.START_ONBOARDING)}
            use:enhance
          >
            <input
              type="hidden"
              name="party"
              value="tenant"
            />
            <Button type="submit">Iniciar onboarding</Button
            >
          </form>
        </div>
      </div>
    {:else}
      {#if cert_result?.errors?.check_certificates}
        <span class="error"
          >{cert_result.errors.check_certificates}</span
        >
      {/if}
      {#if cert_result?.errors?.send_for_signing}
        <span class="error"
          >{cert_result.errors.send_for_signing}</span
        >
      {/if}
      {#if cert_result?.landlord_has_cert !== undefined}
        <div class="signing-status">
          <div class="signing-party">
            <p class="info-block-label">Locador</p>
            <p>
              {cert_result.landlord_has_cert
                ? "Tiene certificado"
                : "Sin certificado"}
            </p>
          </div>
          <div class="signing-party">
            <p class="info-block-label">Locatario</p>
            <p>
              {cert_result.tenant_has_cert
                ? "Tiene certificado"
                : "Sin certificado"}
            </p>
          </div>
          {#if cert_result.landlord_has_cert && cert_result.tenant_has_cert}
            <form
              method="POST"
              action={compose_action(
                ACTION.SEND_FOR_SIGNING,
              )}
              use:enhance
            >
              <input
                type="hidden"
                name="contract_id"
                value={data.contract.id}
              />
              <Button type="submit">Enviar a firmar</Button>
            </form>
          {/if}
        </div>
      {/if}
      <div class="signing-status">
        <form
          method="POST"
          action={compose_action(ACTION.CHECK_CERTIFICATES)}
          use:enhance
        >
          <Button type="submit"
            >Verificar certificados</Button
          >
        </form>
        <div class="signing-party">
          <p class="info-block-label">Locador</p>
          <form
            method="POST"
            action={compose_action(ACTION.START_ONBOARDING)}
            use:enhance
          >
            <input
              type="hidden"
              name="party"
              value="landlord"
            />
            <Button type="submit">Iniciar onboarding</Button
            >
          </form>
        </div>
        <div class="signing-party">
          <p class="info-block-label">Locatario</p>
          <form
            method="POST"
            action={compose_action(ACTION.START_ONBOARDING)}
            use:enhance
          >
            <input
              type="hidden"
              name="party"
              value="tenant"
            />
            <Button type="submit">Iniciar onboarding</Button
            >
          </form>
        </div>
      </div>
    {/if}
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
      <div class="error-block">
        <p class="error-block-title">
          Errores de propiedad:
        </p>
        {#if errors.property_road}
          <span class="error block"
            >{errors.property_road}</span
          >
        {/if}
        {#if errors.property_house_number}
          <span class="error block"
            >{errors.property_house_number}</span
          >
        {/if}
        {#if errors.property_state}
          <span class="error block"
            >{errors.property_state}</span
          >
        {/if}
        {#if errors.property_unit}
          <span class="error block"
            >{errors.property_unit}</span
          >
        {/if}
      </div>
    {/if}
    <ul class="file-list">
      {#each data.contract.files as file (file.id)}
        {@const contract_type = v.parse(
          ContractFileTypeSchema,
          file.type,
        )}
        <li class="file-item">
          <span class="file-type"
            >{get_contract_file_type_label(
              contract_type,
            )}</span
          >
          <a
            target="_blank"
            href="/files/{file.id}"
            class="file-link">{file.basename}</a
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
          <Button type="submit">Crear período</Button>
        </Formulary.Actions>
      </Formulary.Root>
    {:else}
      <ul class="period-list">
        {#each data.contract.periods as period, index (period.id)}
          {#if index === 0}
            <li>
              <Formulary.Root
                method="POST"
                action={compose_action(
                  ACTION.UPDATE_PERIOD,
                )}
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
                  <Button type="submit"
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
{/snippet}

{#snippet TenantSection()}
  <Content.Section>
    <Section.Header>
      <Section.Title>inquilino</Section.Title>
    </Section.Header>
    {#if errors.tenant}
      <span class="error">{errors.tenant}</span>
    {/if}
    {#if data.tenant}
      <div class="info-group">
        <div class="info-block">
          <p class="info-block-label">Nombre</p>
          <p>{display_name(data.tenant)}</p>
          {#if errors.tenant_name}
            <span class="error">{errors.tenant_name}</span>
          {/if}
          {#if errors.tenant_surname}
            <span class="error"
              >{errors.tenant_surname}</span
            >
          {/if}
        </div>
        <div class="info-block">
          <p class="info-block-label">Email</p>
          <p>{data.tenant.email}</p>
          {#if errors.tenant_email}
            <span class="error">{errors.tenant_email}</span>
          {/if}
        </div>
        <div class="info-block">
          <p class="info-block-label">Teléfono</p>
          <p>{data.tenant.phone_number ?? "-"}</p>
          {#if errors.tenant_phone_number}
            <span class="error"
              >{errors.tenant_phone_number}</span
            >
          {/if}
        </div>
        <div class="info-block">
          <p class="info-block-label">DNI</p>
          <p>{data.tenant.document_number ?? "-"}</p>
          {#if errors.tenant_document_number}
            <span class="error"
              >{errors.tenant_document_number}</span
            >
          {/if}
        </div>
      </div>
    {:else}
      <p class="empty-state">Sin inquilino asignado</p>
      <a href="/admin/candidates" class="add-link">
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
      <span class="error">{errors.landlord}</span>
    {/if}
    {#if data.landlord}
      <div class="info-group">
        <div class="info-block">
          <p class="info-block-label">Nombre</p>
          <p>{display_name(data.landlord)}</p>
          {#if errors.landlord_name}
            <span class="error">{errors.landlord_name}</span
            >
          {/if}
          {#if errors.landlord_surname}
            <span class="error"
              >{errors.landlord_surname}</span
            >
          {/if}
        </div>
        <div class="info-block">
          <p class="info-block-label">Email</p>
          <p>{data.landlord.email}</p>
          {#if errors.landlord_email}
            <span class="error"
              >{errors.landlord_email}</span
            >
          {/if}
        </div>
        <div class="info-block">
          <p class="info-block-label">Teléfono</p>
          <p>{data.landlord.phone_number ?? "-"}</p>
          {#if errors.landlord_phone_number}
            <span class="error"
              >{errors.landlord_phone_number}</span
            >
          {/if}
        </div>
        <div class="info-block">
          <p class="info-block-label">DNI</p>
          <p>{data.landlord.document_number ?? "-"}</p>
          {#if errors.landlord_document_number}
            <span class="error"
              >{errors.landlord_document_number}</span
            >
          {/if}
        </div>
      </div>
    {:else}
      <p class="empty-state">Sin propietario asignado</p>
      <a
        href="/admin/properties/{data.property
          .id}/edit#members"
        class="add-link"
      >
        <Button>Agregar propietario</Button>
      </a>
    {/if}
  </Content.Section>
{/snippet}
<Content.Root>
  <Content.Title>Edición de contrato</Content.Title>
  <p class="property-link-text">
    Propiedad:
    <a
      href="/admin/properties/{data.property.id}/edit"
      class="property-link"
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
  {@render SectionSeventeen()}
  {@render SectionTwentyOne()}
  {@render ActionsSection()}
  {#if has_contract_pdf}
    {@render SigningSection()}
  {/if}
  {@render DocumentsSection()}
  {@render PeriodsSection()}
</Content.Root>

<style>
  .error {
    color: rgb(239 68 68);
  }
  .block {
    display: block;
  }
  .field-label {
    font-weight: 500;
  }
  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .item-list {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  .item-card {
    border: 1px solid rgb(55 65 81);
    padding: 1rem;
    border-radius: 0.25rem;
  }
  .photos-section {
    margin-top: 1rem;
  }
  .photos-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .photos-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(156 163 175);
  }
  .photos-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }
  .photo-item {
    position: relative;
  }
  .photo {
    width: 24rem;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
    border-radius: 0.25rem;
  }
  .photo-delete {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    background-color: rgb(209 213 219);
  }
  .hidden-form {
    display: contents;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  .hint {
    color: rgb(156 163 175);
  }
  .guarantors-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  .guarantors-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .guarantor-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .error-block {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .error-block-title {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: rgb(239 68 68);
  }
  .file-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .file-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .file-type {
    font-weight: 700;
  }
  .file-link {
    color: rgb(59 130 246);
    text-decoration: underline;
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
  .info-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .info-block {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .info-block-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(107 114 128);
  }
  .empty-state {
    color: rgb(107 114 128);
    font-size: 0.875rem;
    line-height: 1.25rem;
  }
  .add-link {
    display: inline-block;
    margin-top: 0.5rem;
  }
  .property-link-text {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(156 163 175);
  }
  .property-link {
    color: rgb(59 130 246);
    text-decoration: underline;
  }
  .signing-status {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .signing-party {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  .signing-success {
    padding: 0.75rem;
    border-radius: 0.25rem;
    background-color: rgb(34 197 94 / 0.1);
    border: 1px solid rgb(34 197 94);
  }
  .signing-success-text {
    color: rgb(34 197 94);
    font-weight: 500;
  }
</style>

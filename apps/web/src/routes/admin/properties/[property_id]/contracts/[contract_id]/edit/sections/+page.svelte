<script lang="ts">
  import { untrack } from "svelte"
  import { enhance } from "$app/forms"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import * as Dialog from "$lib/components/Dialog"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import LocationInput from "$lib/components/LocationInput.svelte"
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
  import { get_property_destiny_label } from "$lib/property_destiny"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "../actions/action"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()

  let errors = $derived(
    (form?.errors as any)?.create_pdf ?? {},
  )
  let warranty_errors = $derived(
    (form?.errors as any)?.create_warranty ?? {},
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
  let add_guarantor_dialog: HTMLDialogElement | undefined =
    $state()

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
  <Disclosure title="Sección 2: estado">
    <form
      method="POST"
      action={compose_action(ACTION.CREATE_CONTRACT_ITEM)}
      use:enhance
    >
      <Button variant="primary" type="submit"
        >Agregar item</Button
      >
    </form>
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
                variant="primary"
                type="submit"
                formaction={compose_action(
                  ACTION.UPDATE_CONTRACT_ITEM,
                )}>Guardar item</Button
              >
              <Button
                variant="secondary"
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
                variant="secondary"
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
                    src={`/files/${file.id}`}
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
                    <Button
                      variant="secondary"
                      type="submit">X</Button
                    >
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
  </Disclosure>
{/snippet}

{#snippet SectionThree()}
  <Disclosure title="Sección 3: destino">
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
        <Button variant="primary" type="submit"
          >Guardar destino</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet SectionSix()}
  <Disclosure title="Sección 6: plazo">
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
        <Button variant="primary" type="submit"
          >Guardar plazo</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet SectionSeven()}
  <Disclosure title="Sección 7: canon locativo">
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
        <Button variant="primary" type="submit"
          >Guardar valores</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet SectionEight()}
  <Disclosure title="Sección 8: forma de pago">
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
        <Button variant="primary" type="submit"
          >Guardar CBU</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet SectionNine()}
  <Disclosure title="Sección 9: mora">
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
        <Button variant="primary" type="submit"
          >Guardar porcentaje</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet SectionFourteen()}
  <Disclosure title="Sección 14: devoluciones">
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
        <Button variant="primary" type="submit"
          >Guardar porcentaje</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet SectionFifteen()}
  <Disclosure title="Sección 15: recesión anticipada">
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
        <Button variant="primary" type="submit"
          >Guardar recesión anticipada</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet SectionSixteen()}
  <Disclosure title="Sección 16: muestra de propiedad">
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
        <Button variant="primary" type="submit"
          >Guardar cantidad</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet SectionSeventeen()}
  <Disclosure title="Sección 17: garantía">
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
          {#if !data.warranty}
            <p class="hint">
              Guardar para agregar garantes
            </p>
          {/if}
        {/if}
      </Formulary.Fields>
      {#if selected_warranty_type}
        <Formulary.Actions>
          <Button variant="primary" type="submit"
            >{data.warranty ? "Guardar" : "Crear"} garantía</Button
          >
          {#if selected_warranty_type === WARRANTY_TYPE.INCOME && data.warranty && data.warranty.income_warranty}
            <Button
              type="button"
              variant="secondary"
              onclick={() =>
                add_guarantor_dialog?.showModal()}
              >Agregar garante</Button
            >
          {/if}
        </Formulary.Actions>
      {/if}
    </Formulary.Root>
    {#if selected_warranty_type === WARRANTY_TYPE.INCOME && data.warranty}
      {#if data.warranty.income_warranty}
        {#if data.warranty.income_warranty.guarantors.length > 0}
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
                      <Button
                        variant="primary"
                        type="submit">Guardar</Button
                      >
                      <Button
                        variant="secondary"
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
          </div>
        {/if}
      {/if}
      {@const warranty_id = data.warranty.id}
      <Dialog.Root bind:element={add_guarantor_dialog}>
        {#snippet children({ close })}
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Agregar garante</Dialog.Title>
              <Dialog.Close onclick={close} />
            </Dialog.Header>
            <Formulary.Root
              method="POST"
              action={compose_action(
                ACTION.ADD_INCOME_GUARANTOR,
              )}
            >
              <Formulary.Fields>
                <input
                  type="hidden"
                  value={warranty_id}
                  name="warranty_id"
                />
                <Formulary.Field>
                  <Formulary.Label for="new_guarantor_name"
                    >nombre</Formulary.Label
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
                <Button variant="primary" type="submit"
                  >Agregar</Button
                >
              </Formulary.Actions>
            </Formulary.Root>
          </Dialog.Content>
        {/snippet}
      </Dialog.Root>
    {/if}
  </Disclosure>
{/snippet}

{#snippet SectionTwentyOne()}
  <Disclosure title="Sección 21: jurisdicción">
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
        <Button variant="primary" type="submit"
          >Guardar jurisdicción</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  </Disclosure>
{/snippet}

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

<style>
  .error {
    color: rgb(239 68 68);
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
</style>

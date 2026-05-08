<script lang="ts">
  import { untrack } from "svelte"
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
  import { add_income_guarantor } from "./forms/add_income_guarantor.remote"
  import { create_contract_item } from "./forms/create_contract_item.remote"
  import { create_contract_item_file } from "./forms/create_contract_item_file.remote"
  import { create_income_warranty } from "./forms/create_income_warranty.remote"
  import { create_property_warranty } from "./forms/create_property_warranty.remote"
  import { create_surety_warranty } from "./forms/create_surety_warranty.remote"
  import { destroy_contract_item } from "./forms/destroy_contract_item.remote"
  import { destroy_contract_item_file } from "./forms/destroy_contract_item_file.remote"
  import { destroy_income_guarantor } from "./forms/destroy_income_guarantor.remote"
  import { update_contract_canon } from "./forms/update_contract_canon.remote"
  import { update_contract_destiny } from "./forms/update_contract_destiny.remote"
  import { update_contract_early_termination } from "./forms/update_contract_early_termination.remote"
  import { update_contract_fine } from "./forms/update_contract_fine.remote"
  import { update_contract_item } from "./forms/update_contract_item.remote"
  import { update_contract_jurisdiction } from "./forms/update_contract_jurisdiction.remote"
  import { update_contract_payment } from "./forms/update_contract_payment.remote"
  import { update_contract_return } from "./forms/update_contract_return.remote"
  import { update_contract_showroom } from "./forms/update_contract_showroom.remote"
  import { update_contract_term } from "./forms/update_contract_term.remote"
  import { update_income_guarantor } from "./forms/update_income_guarantor.remote"
  import { update_income_warranty } from "./forms/update_income_warranty.remote"
  import { update_property_warranty } from "./forms/update_property_warranty.remote"
  import { update_surety_warranty } from "./forms/update_surety_warranty.remote"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

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

  let destiny_error = $state<string | null>(null)
  let term_error = $state<string | null>(null)
  let canon_error = $state<string | null>(null)
  let payment_error = $state<string | null>(null)
  let fine_error = $state<string | null>(null)
  let return_error = $state<string | null>(null)
  let early_termination_error = $state<string | null>(null)
  let showroom_error = $state<string | null>(null)
  let jurisdiction_error = $state<string | null>(null)
  let warranty_error = $state<string | null>(null)
  let create_item_error = $state<string | null>(null)
  let add_guarantor_error = $state<string | null>(null)

  const create_item_attrs = create_contract_item.enhance(
    async ({ submit }) => {
      create_item_error = null
      try {
        await submit()
      } catch {
        create_item_error = "No se pudo agregar"
      }
    },
  )

  const destiny_attrs = update_contract_destiny.enhance(
    async ({ submit }) => {
      destiny_error = null
      try {
        await submit()
      } catch {
        destiny_error = "No se pudo guardar"
      }
    },
  )
  const destiny_label = $derived.by(() => {
    if (update_contract_destiny.pending > 0)
      return "Guardando destino..."
    if (destiny_error) return destiny_error
    if (update_contract_destiny.result?.ok) return "Guardado"
    return "Guardar destino"
  })

  const term_attrs = update_contract_term.enhance(
    async ({ submit }) => {
      term_error = null
      try {
        await submit()
      } catch {
        term_error = "No se pudo guardar"
      }
    },
  )
  const term_label = $derived.by(() => {
    if (update_contract_term.pending > 0)
      return "Guardando plazo..."
    if (term_error) return term_error
    if (update_contract_term.result?.ok) return "Guardado"
    return "Guardar plazo"
  })

  const canon_attrs = update_contract_canon.enhance(
    async ({ submit }) => {
      canon_error = null
      try {
        await submit()
      } catch {
        canon_error = "No se pudo guardar"
      }
    },
  )
  const canon_label = $derived.by(() => {
    if (update_contract_canon.pending > 0)
      return "Guardando valores..."
    if (canon_error) return canon_error
    if (update_contract_canon.result?.ok) return "Guardado"
    return "Guardar valores"
  })

  const payment_attrs = update_contract_payment.enhance(
    async ({ submit }) => {
      payment_error = null
      try {
        await submit()
      } catch {
        payment_error = "No se pudo guardar"
      }
    },
  )
  const payment_label = $derived.by(() => {
    if (update_contract_payment.pending > 0)
      return "Guardando CBU..."
    if (payment_error) return payment_error
    if (update_contract_payment.result?.ok) return "Guardado"
    return "Guardar CBU"
  })

  const fine_attrs = update_contract_fine.enhance(
    async ({ submit }) => {
      fine_error = null
      try {
        await submit()
      } catch {
        fine_error = "No se pudo guardar"
      }
    },
  )
  const fine_label = $derived.by(() => {
    if (update_contract_fine.pending > 0)
      return "Guardando porcentaje..."
    if (fine_error) return fine_error
    if (update_contract_fine.result?.ok) return "Guardado"
    return "Guardar porcentaje"
  })

  const return_attrs = update_contract_return.enhance(
    async ({ submit }) => {
      return_error = null
      try {
        await submit()
      } catch {
        return_error = "No se pudo guardar"
      }
    },
  )
  const return_label = $derived.by(() => {
    if (update_contract_return.pending > 0)
      return "Guardando porcentaje..."
    if (return_error) return return_error
    if (update_contract_return.result?.ok) return "Guardado"
    return "Guardar porcentaje"
  })

  const early_termination_attrs =
    update_contract_early_termination.enhance(
      async ({ submit }) => {
        early_termination_error = null
        try {
          await submit()
        } catch {
          early_termination_error = "No se pudo guardar"
        }
      },
    )
  const early_termination_label = $derived.by(() => {
    if (update_contract_early_termination.pending > 0)
      return "Guardando recesión anticipada..."
    if (early_termination_error)
      return early_termination_error
    if (update_contract_early_termination.result?.ok)
      return "Guardado"
    return "Guardar recesión anticipada"
  })

  const showroom_attrs = update_contract_showroom.enhance(
    async ({ submit }) => {
      showroom_error = null
      try {
        await submit()
      } catch {
        showroom_error = "No se pudo guardar"
      }
    },
  )
  const showroom_label = $derived.by(() => {
    if (update_contract_showroom.pending > 0)
      return "Guardando cantidad..."
    if (showroom_error) return showroom_error
    if (update_contract_showroom.result?.ok) return "Guardado"
    return "Guardar cantidad"
  })

  const jurisdiction_attrs =
    update_contract_jurisdiction.enhance(
      async ({ submit }) => {
        jurisdiction_error = null
        try {
          await submit()
        } catch {
          jurisdiction_error = "No se pudo guardar"
        }
      },
    )
  const jurisdiction_label = $derived.by(() => {
    if (update_contract_jurisdiction.pending > 0)
      return "Guardando jurisdicción..."
    if (jurisdiction_error) return jurisdiction_error
    if (update_contract_jurisdiction.result?.ok)
      return "Guardado"
    return "Guardar jurisdicción"
  })

  const create_property_warranty_attrs =
    create_property_warranty.enhance(async ({ submit }) => {
      warranty_error = null
      try {
        await submit()
      } catch {
        warranty_error = "No se pudo crear"
      }
    })
  const create_income_warranty_attrs =
    create_income_warranty.enhance(async ({ submit }) => {
      warranty_error = null
      try {
        await submit()
      } catch {
        warranty_error = "No se pudo crear"
      }
    })
  const create_surety_warranty_attrs =
    create_surety_warranty.enhance(async ({ submit }) => {
      warranty_error = null
      try {
        await submit()
      } catch {
        warranty_error = "No se pudo crear"
      }
    })
  const update_property_warranty_attrs =
    update_property_warranty.enhance(async ({ submit }) => {
      warranty_error = null
      try {
        await submit()
      } catch {
        warranty_error = "No se pudo guardar"
      }
    })
  const update_income_warranty_attrs =
    update_income_warranty.enhance(async ({ submit }) => {
      warranty_error = null
      try {
        await submit()
      } catch {
        warranty_error = "No se pudo guardar"
      }
    })
  const update_surety_warranty_attrs =
    update_surety_warranty.enhance(async ({ submit }) => {
      warranty_error = null
      try {
        await submit()
      } catch {
        warranty_error = "No se pudo guardar"
      }
    })

  const add_guarantor_attrs = add_income_guarantor.enhance(
    async ({ submit }) => {
      add_guarantor_error = null
      try {
        await submit()
      } catch {
        add_guarantor_error = "No se pudo agregar"
      }
    },
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
  <Disclosure name="sections" title="Sección 2: estado">
    <form {...create_item_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <Button
        variant="primary"
        type="submit"
        disabled={create_contract_item.pending > 0}
        >Agregar item</Button
      >
      {#if create_item_error}
        <span class="form-error">{create_item_error}</span>
      {/if}
    </form>
    <ul class="item-list">
      {#each data.contract.contract_items as contract_item (contract_item.id)}
        {@const update_item = update_contract_item.for(
          contract_item.id,
        )}
        {@const destroy_item = destroy_contract_item.for(
          contract_item.id,
        )}
        {@const create_file = create_contract_item_file.for(
          contract_item.id,
        )}
        <li class="item-card">
          <form
            {...update_item.enhance(async ({ submit }) => {
              try {
                await submit()
              } catch {
                /* surfaced inline */
              }
            })}
          >
            <input
              type="hidden"
              name="id"
              value={contract_item.id}
            />
            <input
              type="hidden"
              name="contract_id"
              value={data.contract.id}
            />
            <input
              type="hidden"
              name="property_id"
              value={data.property.id}
            />
            <div class="form-fields">
              <div class="form-field">
                <label for={`name_${contract_item.id}`}
                  >nombre</label
                >
                <input
                  id={`name_${contract_item.id}`}
                  type="text"
                  name="name"
                  value={contract_item.name}
                />
                {#each update_item.fields.name.issues() as issue}
                  <span class="form-error"
                    >{issue.message}</span
                  >
                {/each}
              </div>
              <div class="form-field">
                <label for={`state_${contract_item.id}`}
                  >estado</label
                >
                <select
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
                </select>
              </div>
            </div>
            <div class="form-actions">
              <Button
                variant="primary"
                type="submit"
                disabled={update_item.pending > 0}
              >
                {update_item.pending > 0
                  ? "Guardando item..."
                  : update_item.result?.ok
                    ? "Guardado"
                    : "Guardar item"}
              </Button>
            </div>
          </form>
          <form
            {...destroy_item.enhance(async ({ submit }) => {
              try {
                await submit()
              } catch {
                /* surfaced inline */
              }
            })}
          >
            <input
              type="hidden"
              name="id"
              value={contract_item.id}
            />
            <input
              type="hidden"
              name="contract_id"
              value={data.contract.id}
            />
            <input
              type="hidden"
              name="property_id"
              value={data.property.id}
            />
            <Button
              variant="secondary"
              type="submit"
              disabled={destroy_item.pending > 0}
            >
              {destroy_item.pending > 0
                ? "Eliminando item..."
                : "Eliminar item"}
            </Button>
          </form>
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
                {@const destroy_file =
                  destroy_contract_item_file.for(file.id)}
                <li class="photo-item">
                  <img
                    class="photo"
                    alt="Foto del item"
                    src={`/files/${file.id}`}
                  />
                  <form
                    {...destroy_file.enhance(
                      async ({ submit }) => {
                        try {
                          await submit()
                        } catch {
                          /* surfaced inline */
                        }
                      },
                    )}
                    class="photo-delete"
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
                    <input
                      type="hidden"
                      value={data.contract.id}
                      name="contract_id"
                    />
                    <input
                      type="hidden"
                      value={data.property.id}
                      name="property_id"
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
              {...create_file.enhance(async ({ submit }) => {
                try {
                  await submit()
                } catch {
                  /* surfaced inline */
                }
              })}
              enctype="multipart/form-data"
              class="hidden-form"
            >
              <input
                type="hidden"
                value={contract_item.id}
                name="contract_item_id"
              />
              <input
                type="hidden"
                value={data.contract.id}
                name="contract_id"
              />
              <input
                type="hidden"
                value={data.property.id}
                name="property_id"
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
  <Disclosure name="sections" title="Sección 3: destino">
    <form {...destiny_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <div class="form-fields">
        <div class="form-field">
          <span class="field-label">Tipo</span>
          {#each data.property.destinies as destiny}
            <label class="radio-label">
              <input
                type="radio"
                name="destiny"
                value={destiny}
                checked={data.contract.destiny === destiny}
              />
              {get_property_destiny_label(destiny)}
            </label>
          {/each}
          {#each update_contract_destiny.fields.destiny.issues() as issue}
            <span class="form-error">{issue.message}</span>
          {/each}
        </div>
      </div>
      <div class="form-actions">
        <Button
          variant="primary"
          type="submit"
          disabled={update_contract_destiny.pending > 0}
          >{destiny_label}</Button
        >
      </div>
    </form>
  </Disclosure>
{/snippet}

{#snippet SectionSix()}
  <Disclosure name="sections" title="Sección 6: plazo">
    <form {...term_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <div class="form-fields">
        <div class="form-field">
          <label for="start_date">fecha de inicio</label>
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
          {#each update_contract_term.fields.start_date.issues() as issue}
            <span class="form-error">{issue.message}</span>
          {/each}
        </div>
        <div class="form-field">
          <label for="end_date">fecha de finalización</label>
          <input
            id="end_date"
            name="end_date"
            type="datetime-local"
            value={data.contract.end_date
              ? format_date_for_input(data.contract.end_date)
              : ""}
          />
          {#each update_contract_term.fields.end_date.issues() as issue}
            <span class="form-error">{issue.message}</span>
          {/each}
        </div>
      </div>
      <div class="form-actions">
        <Button
          variant="primary"
          type="submit"
          disabled={update_contract_term.pending > 0}
          >{term_label}</Button
        >
      </div>
    </form>
  </Disclosure>
{/snippet}

{#snippet SectionSeven()}
  <Disclosure
    name="sections"
    title="Sección 7: canon locativo"
  >
    <form {...canon_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <div class="form-fields">
        <div class="form-field">
          <label for="escalation_type">tipo</label>
          <select
            name="escalation_type"
            id="escalation_type"
            value={data.contract.escalation_type ?? ""}
          >
            {#each Object.values(ESCALATION_TYPE) as type}
              <option value={type}
                >{get_escalation_label(type)}</option
              >
            {/each}
          </select>
          {#each update_contract_canon.fields.escalation_type.issues() as issue}
            <span class="form-error">{issue.message}</span>
          {/each}
        </div>
        <div class="form-field">
          <label for="escalation_duration">cada</label>
          <select
            name="escalation_duration"
            id="escalation_duration"
            value={data.contract.escalation_duration ?? ""}
          >
            {#each DURATIONS as duration}
              <option value={duration}
                >{get_duration_label(duration)}</option
              >
            {/each}
          </select>
          {#each update_contract_canon.fields.escalation_duration.issues() as issue}
            <span class="form-error">{issue.message}</span>
          {/each}
        </div>
      </div>
      <div class="form-actions">
        <Button
          variant="primary"
          type="submit"
          disabled={update_contract_canon.pending > 0}
          >{canon_label}</Button
        >
      </div>
    </form>
  </Disclosure>
{/snippet}

{#snippet SectionEight()}
  <Disclosure
    name="sections"
    title="Sección 8: forma de pago"
  >
    <form {...payment_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <div class="form-fields">
        <div class="form-field">
          <label for="cbu">cbu</label>
          <input
            id="cbu"
            name="cbu"
            type="text"
            value={data.contract.cbu ?? ""}
          />
        </div>
      </div>
      <div class="form-actions">
        <Button
          variant="primary"
          type="submit"
          disabled={update_contract_payment.pending > 0}
          >{payment_label}</Button
        >
      </div>
    </form>
  </Disclosure>
{/snippet}

{#snippet SectionNine()}
  <Disclosure name="sections" title="Sección 9: mora">
    <form {...fine_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <div class="form-fields">
        <div class="form-field">
          <label for="fine_amount">porcentaje</label>
          <input
            id="fine_amount"
            name="fine_amount"
            type="number"
            value={data.contract.fine_amount ?? ""}
          />
          {#each update_contract_fine.fields.fine_amount.issues() as issue}
            <span class="form-error">{issue.message}</span>
          {/each}
        </div>
      </div>
      <div class="form-actions">
        <Button
          variant="primary"
          type="submit"
          disabled={update_contract_fine.pending > 0}
          >{fine_label}</Button
        >
      </div>
    </form>
  </Disclosure>
{/snippet}

{#snippet SectionFourteen()}
  <Disclosure
    name="sections"
    title="Sección 14: devoluciones"
  >
    <form {...return_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <div class="form-fields">
        <div class="form-field">
          <label for="percentage_return">porcentaje</label>
          <input
            id="percentage_return"
            name="percentage_return"
            type="number"
            value={data.contract.percentage_return ?? ""}
          />
        </div>
      </div>
      <div class="form-actions">
        <Button
          variant="primary"
          type="submit"
          disabled={update_contract_return.pending > 0}
          >{return_label}</Button
        >
      </div>
    </form>
  </Disclosure>
{/snippet}

{#snippet SectionFifteen()}
  <Disclosure
    name="sections"
    title="Sección 15: recesión anticipada"
  >
    <form {...early_termination_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <div class="form-fields">
        <div class="form-field">
          <label for="early_termination"
            >días de preaviso</label
          >
          <input
            type="number"
            id="early_termination"
            name="early_termination"
            value={data.contract.early_termination ?? ""}
            min="0"
          />
        </div>
      </div>
      <div class="form-actions">
        <Button
          variant="primary"
          type="submit"
          disabled={update_contract_early_termination.pending >
            0}>{early_termination_label}</Button
        >
      </div>
    </form>
  </Disclosure>
{/snippet}

{#snippet SectionSixteen()}
  <Disclosure
    name="sections"
    title="Sección 16: muestra de propiedad"
  >
    <form {...showroom_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <div class="form-fields">
        <div class="form-field">
          <label for="showroom_hours"
            >cantidad de horas</label
          >
          <input
            id="showroom_hours"
            name="showroom_hours"
            type="number"
            value={data.contract.showroom_hours ?? ""}
          />
        </div>
      </div>
      <div class="form-actions">
        <Button
          variant="primary"
          type="submit"
          disabled={update_contract_showroom.pending > 0}
          >{showroom_label}</Button
        >
      </div>
    </form>
  </Disclosure>
{/snippet}

{#snippet WarrantyTypeSelect()}
  <div class="form-field">
    <label for="warranty_type">tipo de garantía</label>
    <select
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
    </select>
  </div>
{/snippet}

{#snippet HiddenWarrantyIds()}
  <input
    type="hidden"
    name="contract_id"
    value={data.contract.id}
  />
  <input
    type="hidden"
    name="property_id"
    value={data.property.id}
  />
  {#if data.warranty}
    <input
      type="hidden"
      name="warranty_id"
      value={data.warranty.id}
    />
  {/if}
{/snippet}

{#snippet PropertyWarrantyFields(
  fields: typeof create_property_warranty.fields,
)}
  <div class="form-field">
    <label for="guarantor_name">nombre del garante</label>
    <input
      id="guarantor_name"
      name="guarantor_name"
      type="text"
      value={data.warranty?.property_warranty
        ?.guarantor_name ?? ""}
    />
    {#each fields.guarantor_name.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="guarantor_dni">DNI del garante</label>
    <input
      id="guarantor_dni"
      name="guarantor_dni"
      type="text"
      value={data.warranty?.property_warranty
        ?.guarantor_dni ?? ""}
    />
    {#each fields.guarantor_dni.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="guarantor_email">email del garante</label>
    <input
      id="guarantor_email"
      name="guarantor_email"
      type="email"
      value={data.warranty?.property_warranty
        ?.guarantor_email ?? ""}
    />
    {#each fields.guarantor_email.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <LocationInput
    default_value={data.warranty?.property_warranty
      ? `${data.warranty.property_warranty.road} ${data.warranty.property_warranty.house_number}`
      : ""}
    default_lat={data.warranty?.property_warranty?.latitude ??
      ""}
    default_lon={data.warranty?.property_warranty
      ?.longitude ?? ""}
  />
  {#each fields.location.issues() as issue}
    <span class="form-error">{issue.message}</span>
  {/each}
  <div class="form-field">
    <label for="cadastral_district">circunscripción</label>
    <input
      id="cadastral_district"
      name="cadastral_district"
      type="text"
      value={data.warranty?.property_warranty
        ?.cadastral_district ?? ""}
    />
    {#each fields.cadastral_district.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="cadastral_section">sección</label>
    <input
      id="cadastral_section"
      name="cadastral_section"
      type="text"
      value={data.warranty?.property_warranty
        ?.cadastral_section ?? ""}
    />
    {#each fields.cadastral_section.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="cadastral_block">manzana</label>
    <input
      id="cadastral_block"
      name="cadastral_block"
      type="text"
      value={data.warranty?.property_warranty
        ?.cadastral_block ?? ""}
    />
    {#each fields.cadastral_block.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="cadastral_parcel">parcela</label>
    <input
      id="cadastral_parcel"
      name="cadastral_parcel"
      type="text"
      value={data.warranty?.property_warranty
        ?.cadastral_parcel ?? ""}
    />
    {#each fields.cadastral_parcel.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="property_tax_id">partida inmobiliaria</label>
    <input
      id="property_tax_id"
      name="property_tax_id"
      type="text"
      value={data.warranty?.property_warranty
        ?.property_tax_id ?? ""}
    />
    {#each fields.property_tax_id.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
{/snippet}

{#snippet SuretyWarrantyFields(
  fields: typeof create_surety_warranty.fields,
)}
  <div class="form-field">
    <label for="guarantor_name">nombre del garante</label>
    <input
      id="guarantor_name"
      name="guarantor_name"
      type="text"
      value={data.warranty?.surety_warranty?.guarantor_name ??
        ""}
    />
    {#each fields.guarantor_name.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="guarantor_dni">DNI del garante</label>
    <input
      id="guarantor_dni"
      name="guarantor_dni"
      type="text"
      value={data.warranty?.surety_warranty?.guarantor_dni ??
        ""}
    />
    {#each fields.guarantor_dni.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="guarantor_email">email del garante</label>
    <input
      id="guarantor_email"
      name="guarantor_email"
      type="email"
      value={data.warranty?.surety_warranty?.guarantor_email ??
        ""}
    />
    {#each fields.guarantor_email.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="company_name">nombre de la aseguradora</label>
    <input
      id="company_name"
      name="company_name"
      type="text"
      value={data.warranty?.surety_warranty?.company_name ??
        ""}
    />
    {#each fields.company_name.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="policy_number">número de póliza</label>
    <input
      id="policy_number"
      name="policy_number"
      type="text"
      value={data.warranty?.surety_warranty?.policy_number ??
        ""}
    />
    {#each fields.policy_number.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
  <div class="form-field">
    <label for="company_email">email de la aseguradora</label>
    <input
      id="company_email"
      name="company_email"
      type="email"
      value={data.warranty?.surety_warranty?.company_email ??
        ""}
    />
    {#each fields.company_email.issues() as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  </div>
{/snippet}

{#snippet SectionSeventeen()}
  <Disclosure name="sections" title="Sección 17: garantía">
    {#if !data.warranty}
      {#if selected_warranty_type === WARRANTY_TYPE.PROPERTY}
        <form {...create_property_warranty_attrs}>
          {@render HiddenWarrantyIds()}
          <div class="form-fields">
            {@render WarrantyTypeSelect()}
            {@render PropertyWarrantyFields(
              create_property_warranty.fields,
            )}
          </div>
          <div class="form-actions">
            <Button
              variant="primary"
              type="submit"
              disabled={create_property_warranty.pending > 0}
            >
              {create_property_warranty.pending > 0
                ? "Creando garantía..."
                : warranty_error
                  ? warranty_error
                  : create_property_warranty.result?.ok
                    ? "Creado"
                    : "Crear garantía"}
            </Button>
          </div>
        </form>
      {:else if selected_warranty_type === WARRANTY_TYPE.SURETY}
        <form {...create_surety_warranty_attrs}>
          {@render HiddenWarrantyIds()}
          <div class="form-fields">
            {@render WarrantyTypeSelect()}
            {@render SuretyWarrantyFields(
              create_surety_warranty.fields,
            )}
          </div>
          <div class="form-actions">
            <Button
              variant="primary"
              type="submit"
              disabled={create_surety_warranty.pending > 0}
            >
              {create_surety_warranty.pending > 0
                ? "Creando garantía..."
                : warranty_error
                  ? warranty_error
                  : create_surety_warranty.result?.ok
                    ? "Creado"
                    : "Crear garantía"}
            </Button>
          </div>
        </form>
      {:else if selected_warranty_type === WARRANTY_TYPE.INCOME}
        <form {...create_income_warranty_attrs}>
          {@render HiddenWarrantyIds()}
          <div class="form-fields">
            {@render WarrantyTypeSelect()}
            <p class="hint">Guardar para agregar garantes</p>
          </div>
          <div class="form-actions">
            <Button
              variant="primary"
              type="submit"
              disabled={create_income_warranty.pending > 0}
            >
              {create_income_warranty.pending > 0
                ? "Creando garantía..."
                : warranty_error
                  ? warranty_error
                  : create_income_warranty.result?.ok
                    ? "Creado"
                    : "Crear garantía"}
            </Button>
          </div>
        </form>
      {:else}
        <div class="form-fields">
          {@render WarrantyTypeSelect()}
        </div>
      {/if}
    {:else if selected_warranty_type === WARRANTY_TYPE.PROPERTY}
      <form {...update_property_warranty_attrs}>
        {@render HiddenWarrantyIds()}
        <div class="form-fields">
          {@render WarrantyTypeSelect()}
          {@render PropertyWarrantyFields(
            update_property_warranty.fields,
          )}
        </div>
        <div class="form-actions">
          <Button
            variant="primary"
            type="submit"
            disabled={update_property_warranty.pending > 0}
          >
            {update_property_warranty.pending > 0
              ? "Guardando garantía..."
              : warranty_error
                ? warranty_error
                : update_property_warranty.result?.ok
                  ? "Guardado"
                  : "Guardar garantía"}
          </Button>
        </div>
      </form>
    {:else if selected_warranty_type === WARRANTY_TYPE.SURETY}
      <form {...update_surety_warranty_attrs}>
        {@render HiddenWarrantyIds()}
        <div class="form-fields">
          {@render WarrantyTypeSelect()}
          {@render SuretyWarrantyFields(
            update_surety_warranty.fields,
          )}
        </div>
        <div class="form-actions">
          <Button
            variant="primary"
            type="submit"
            disabled={update_surety_warranty.pending > 0}
          >
            {update_surety_warranty.pending > 0
              ? "Guardando garantía..."
              : warranty_error
                ? warranty_error
                : update_surety_warranty.result?.ok
                  ? "Guardado"
                  : "Guardar garantía"}
          </Button>
        </div>
      </form>
    {:else if selected_warranty_type === WARRANTY_TYPE.INCOME}
      <form {...update_income_warranty_attrs}>
        {@render HiddenWarrantyIds()}
        <div class="form-fields">
          {@render WarrantyTypeSelect()}
        </div>
        <div class="form-actions">
          <Button
            variant="primary"
            type="submit"
            disabled={update_income_warranty.pending > 0}
          >
            {update_income_warranty.pending > 0
              ? "Guardando garantía..."
              : warranty_error
                ? warranty_error
                : update_income_warranty.result?.ok
                  ? "Guardado"
                  : "Guardar garantía"}
          </Button>
          {#if data.warranty.income_warranty}
            <Button
              type="button"
              variant="secondary"
              onclick={() => add_guarantor_dialog?.showModal()}
              >Agregar garante</Button
            >
          {/if}
        </div>
      </form>
      {#if data.warranty.income_warranty && data.warranty.income_warranty.guarantors.length > 0}
        <div class="guarantors-section">
          <div class="guarantors-header">
            <span class="field-label">Garantes</span>
          </div>
          <ul class="guarantor-list">
            {#each data.warranty.income_warranty.guarantors as guarantor (guarantor.id)}
              {@const update_guarantor =
                update_income_guarantor.for(guarantor.id)}
              {@const destroy_guarantor =
                destroy_income_guarantor.for(guarantor.id)}
              <li class="item-card">
                <form
                  {...update_guarantor.enhance(
                    async ({ submit }) => {
                      try {
                        await submit()
                      } catch {
                        /* surfaced inline */
                      }
                    },
                  )}
                >
                  <input
                    type="hidden"
                    name="id"
                    value={guarantor.id}
                  />
                  <input
                    type="hidden"
                    name="contract_id"
                    value={data.contract.id}
                  />
                  <input
                    type="hidden"
                    name="property_id"
                    value={data.property.id}
                  />
                  <div class="form-fields">
                    <div class="form-field">
                      <label
                        for={`guarantor_name_${guarantor.id}`}
                        >nombre</label
                      >
                      <input
                        id={`guarantor_name_${guarantor.id}`}
                        name="guarantor_name"
                        type="text"
                        value={guarantor.guarantor_name}
                      />
                    </div>
                    <div class="form-field">
                      <label
                        for={`guarantor_dni_${guarantor.id}`}
                        >DNI</label
                      >
                      <input
                        id={`guarantor_dni_${guarantor.id}`}
                        name="guarantor_dni"
                        type="text"
                        value={guarantor.guarantor_dni}
                      />
                    </div>
                    <div class="form-field">
                      <label
                        for={`guarantor_email_${guarantor.id}`}
                        >email</label
                      >
                      <input
                        id={`guarantor_email_${guarantor.id}`}
                        name="guarantor_email"
                        type="email"
                        value={guarantor.guarantor_email}
                      />
                    </div>
                  </div>
                  <div class="form-actions">
                    <Button
                      variant="primary"
                      type="submit"
                      disabled={update_guarantor.pending > 0}
                    >
                      {update_guarantor.pending > 0
                        ? "Guardando..."
                        : "Guardar"}
                    </Button>
                  </div>
                </form>
                <form
                  {...destroy_guarantor.enhance(
                    async ({ submit }) => {
                      try {
                        await submit()
                      } catch {
                        /* surfaced inline */
                      }
                    },
                  )}
                >
                  <input
                    type="hidden"
                    name="id"
                    value={guarantor.id}
                  />
                  <input
                    type="hidden"
                    name="contract_id"
                    value={data.contract.id}
                  />
                  <input
                    type="hidden"
                    name="property_id"
                    value={data.property.id}
                  />
                  <Button
                    variant="secondary"
                    type="submit"
                    disabled={destroy_guarantor.pending > 0}
                  >
                    {destroy_guarantor.pending > 0
                      ? "Eliminando..."
                      : "Eliminar"}
                  </Button>
                </form>
              </li>
            {/each}
          </ul>
        </div>
      {/if}
      <Dialog.Root bind:element={add_guarantor_dialog}>
        {#snippet children({ close })}
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Agregar garante</Dialog.Title>
              <Dialog.Close onclick={close} />
            </Dialog.Header>
            <form {...add_guarantor_attrs}>
              <input
                type="hidden"
                name="warranty_id"
                value={data.warranty.id}
              />
              <input
                type="hidden"
                name="contract_id"
                value={data.contract.id}
              />
              <input
                type="hidden"
                name="property_id"
                value={data.property.id}
              />
              <div class="form-fields">
                <div class="form-field">
                  <label for="new_guarantor_name"
                    >nombre</label
                  >
                  <input
                    id="new_guarantor_name"
                    name="guarantor_name"
                    type="text"
                  />
                </div>
                <div class="form-field">
                  <label for="new_guarantor_dni">DNI</label>
                  <input
                    id="new_guarantor_dni"
                    name="guarantor_dni"
                    type="text"
                  />
                </div>
                <div class="form-field">
                  <label for="new_guarantor_email"
                    >email</label
                  >
                  <input
                    id="new_guarantor_email"
                    name="guarantor_email"
                    type="email"
                  />
                </div>
              </div>
              <div class="form-actions">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={add_income_guarantor.pending > 0}
                >
                  {add_income_guarantor.pending > 0
                    ? "Agregando..."
                    : add_guarantor_error
                      ? add_guarantor_error
                      : add_income_guarantor.result?.ok
                        ? "Agregado"
                        : "Agregar"}
                </Button>
              </div>
            </form>
          </Dialog.Content>
        {/snippet}
      </Dialog.Root>
    {:else}
      <div class="form-fields">
        {@render WarrantyTypeSelect()}
      </div>
    {/if}
  </Disclosure>
{/snippet}

{#snippet SectionTwentyOne()}
  <Disclosure
    name="sections"
    title="Sección 21: jurisdicción"
  >
    <form {...jurisdiction_attrs}>
      <input
        type="hidden"
        name="contract_id"
        value={data.contract.id}
      />
      <input
        type="hidden"
        name="property_id"
        value={data.property.id}
      />
      <div class="form-fields">
        <div class="form-field">
          <label for="court_id">tribunal</label>
          <select
            name="court_id"
            id="court_id"
            value={data.contract.court_id ?? ""}
          >
            {#each Object.values(COURT) as type}
              <option value={type}
                >{get_court_label(type)}</option
              >
            {/each}
          </select>
        </div>
      </div>
      <div class="form-actions">
        <Button
          variant="primary"
          type="submit"
          disabled={update_contract_jurisdiction.pending > 0}
          >{jurisdiction_label}</Button
        >
      </div>
    </form>
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

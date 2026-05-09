<script lang="ts">
  import { untrack } from "svelte"
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import LocationInput from "$lib/components/LocationInput.svelte"
  import {
    WARRANTY_TYPE,
    get_warranty_type_label,
  } from "$lib/warranty_type"
  import { get_current_disclosure, set_current_disclosure } from "$lib/disclousure_cookie.remote"
  import { create_income_warranty } from "../forms/create_income_warranty.remote"
  import { create_property_warranty } from "../forms/create_property_warranty.remote"
  import { create_surety_warranty } from "../forms/create_surety_warranty.remote"
  import { update_income_warranty } from "../forms/update_income_warranty.remote"
  import { update_property_warranty } from "../forms/update_property_warranty.remote"
  import { update_surety_warranty } from "../forms/update_surety_warranty.remote"
  import type { PageData } from "../$types"
  import AddGuarantorDialog from "./add_guarantor_dialog.svelte"
  import GuarantorRow from "./guarantor_row.svelte"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("sections")

  let selected_warranty_type = $state(
    untrack(() => data.warranty?.type ?? ""),
  )
  let add_guarantor_dialog: HTMLDialogElement | undefined =
    $state()
</script>

{#snippet TypeSelect()}
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

{#snippet HiddenIds()}
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

{#snippet PropertyFields(
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

{#snippet SuretyFields(
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

<Disclosure
  name="section"
  open={(await current) === "seventeen"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "sections",
      value: current.current === "seventeen" ? "" : "seventeen",
    })
  }}
  title="Sección 17: garantía"
>
  {#if !data.warranty}
    {#if selected_warranty_type === WARRANTY_TYPE.PROPERTY}
      <form
        {...create_property_warranty.enhance(
          async ({ submit }) => {
            const ok = await submit()
            if (ok) await invalidateAll()
          },
        )}
      >
        {@render HiddenIds()}
        <div class="form-fields">
          {@render TypeSelect()}
          {@render PropertyFields(
            create_property_warranty.fields,
          )}
        </div>
        <div class="form-actions">
          <Formulary.Submission
            form={create_property_warranty}
          >
            {#snippet children({ is_busy, is_done })}
              <Button
                variant="primary"
                type="submit"
                disabled={is_busy()}
              >
                <Formulary.SubmissionLabel
                  is_busy={is_busy()}
                  is_done={is_done()}
                  idle="Crear garantía"
                  busy="Creando garantía..."
                  done="Creado"
                />
              </Button>
            {/snippet}
          </Formulary.Submission>
        </div>
      </form>
    {:else if selected_warranty_type === WARRANTY_TYPE.SURETY}
      <form
        {...create_surety_warranty.enhance(
          async ({ submit }) => {
            const ok = await submit()
            if (ok) await invalidateAll()
          },
        )}
      >
        {@render HiddenIds()}
        <div class="form-fields">
          {@render TypeSelect()}
          {@render SuretyFields(
            create_surety_warranty.fields,
          )}
        </div>
        <div class="form-actions">
          <Formulary.Submission form={create_surety_warranty}>
            {#snippet children({ is_busy, is_done })}
              <Button
                variant="primary"
                type="submit"
                disabled={is_busy()}
              >
                <Formulary.SubmissionLabel
                  is_busy={is_busy()}
                  is_done={is_done()}
                  idle="Crear garantía"
                  busy="Creando garantía..."
                  done="Creado"
                />
              </Button>
            {/snippet}
          </Formulary.Submission>
        </div>
      </form>
    {:else if selected_warranty_type === WARRANTY_TYPE.INCOME}
      <form
        {...create_income_warranty.enhance(
          async ({ submit }) => {
            const ok = await submit()
            if (ok) await invalidateAll()
          },
        )}
      >
        {@render HiddenIds()}
        <div class="form-fields">
          {@render TypeSelect()}
          <p class="hint">Guardar para agregar garantes</p>
        </div>
        <div class="form-actions">
          <Formulary.Submission form={create_income_warranty}>
            {#snippet children({ is_busy, is_done })}
              <Button
                variant="primary"
                type="submit"
                disabled={is_busy()}
              >
                <Formulary.SubmissionLabel
                  is_busy={is_busy()}
                  is_done={is_done()}
                  idle="Crear garantía"
                  busy="Creando garantía..."
                  done="Creado"
                />
              </Button>
            {/snippet}
          </Formulary.Submission>
        </div>
      </form>
    {:else}
      <div class="form-fields">
        {@render TypeSelect()}
      </div>
    {/if}
  {:else if selected_warranty_type === WARRANTY_TYPE.PROPERTY}
    <form
      {...update_property_warranty.enhance(
        async ({ submit }) => {
          const ok = await submit()
          if (ok) await invalidateAll()
        },
      )}
    >
      {@render HiddenIds()}
      <div class="form-fields">
        {@render TypeSelect()}
        {@render PropertyFields(
          update_property_warranty.fields,
        )}
      </div>
      <div class="form-actions">
        <Formulary.Submission form={update_property_warranty}>
          {#snippet children({ is_busy, is_done })}
            <Button
              variant="primary"
              type="submit"
              disabled={is_busy()}
            >
              <Formulary.SubmissionLabel
                is_busy={is_busy()}
                is_done={is_done()}
                idle="Guardar garantía"
                busy="Guardando garantía..."
                done="Guardado"
              />
            </Button>
          {/snippet}
        </Formulary.Submission>
      </div>
    </form>
  {:else if selected_warranty_type === WARRANTY_TYPE.SURETY}
    <form
      {...update_surety_warranty.enhance(
        async ({ submit }) => {
          const ok = await submit()
          if (ok) await invalidateAll()
        },
      )}
    >
      {@render HiddenIds()}
      <div class="form-fields">
        {@render TypeSelect()}
        {@render SuretyFields(update_surety_warranty.fields)}
      </div>
      <div class="form-actions">
        <Formulary.Submission form={update_surety_warranty}>
          {#snippet children({ is_busy, is_done })}
            <Button
              variant="primary"
              type="submit"
              disabled={is_busy()}
            >
              <Formulary.SubmissionLabel
                is_busy={is_busy()}
                is_done={is_done()}
                idle="Guardar garantía"
                busy="Guardando garantía..."
                done="Guardado"
              />
            </Button>
          {/snippet}
        </Formulary.Submission>
      </div>
    </form>
  {:else if selected_warranty_type === WARRANTY_TYPE.INCOME}
    <form
      {...update_income_warranty.enhance(
        async ({ submit }) => {
          const ok = await submit()
          if (ok) await invalidateAll()
        },
      )}
    >
      {@render HiddenIds()}
      <div class="form-fields">
        {@render TypeSelect()}
      </div>
      <div class="form-actions">
        <Formulary.Submission form={update_income_warranty}>
          {#snippet children({ is_busy, is_done })}
            <Button
              variant="primary"
              type="submit"
              disabled={is_busy()}
            >
              <Formulary.SubmissionLabel
                is_busy={is_busy()}
                is_done={is_done()}
                idle="Guardar garantía"
                busy="Guardando garantía..."
                done="Guardado"
              />
            </Button>
          {/snippet}
        </Formulary.Submission>
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
            <GuarantorRow
              {guarantor}
              contract_id={data.contract.id}
              property_id={data.property.id}
            />
          {/each}
        </ul>
      </div>
    {/if}
    <AddGuarantorDialog
      bind:element={add_guarantor_dialog}
      warranty_id={data.warranty.id}
      contract_id={data.contract.id}
      property_id={data.property.id}
    />
  {:else}
    <div class="form-fields">
      {@render TypeSelect()}
    </div>
  {/if}
</Disclosure>

<style>
  .field-label {
    font-weight: 500;
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

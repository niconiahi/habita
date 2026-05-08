<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import * as Dialog from "$lib/components/Dialog"
  import * as Formulary from "$lib/components/Formulary"
  import { add_income_guarantor } from "../forms/add_income_guarantor.remote"

  let {
    element = $bindable(),
    warranty_id,
    contract_id,
    property_id,
  }: {
    element?: HTMLDialogElement
    warranty_id: number
    contract_id: number
    property_id: number
  } = $props()
</script>

<Dialog.Root bind:element>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Agregar garante</Dialog.Title>
        <Dialog.Close onclick={close} />
      </Dialog.Header>
      <form {...add_income_guarantor}>
        <input
          type="hidden"
          name="warranty_id"
          value={warranty_id}
        />
        <input
          type="hidden"
          name="contract_id"
          value={contract_id}
        />
        <input
          type="hidden"
          name="property_id"
          value={property_id}
        />
        <div class="form-fields">
          <div class="form-field">
            <label for="new_guarantor_name">nombre</label>
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
            <label for="new_guarantor_email">email</label>
            <input
              id="new_guarantor_email"
              name="guarantor_email"
              type="email"
            />
          </div>
        </div>
        <div class="form-actions">
          <Formulary.Submission form={add_income_guarantor}>
            {#snippet children({ is_busy, is_done })}
              <Button
                variant="primary"
                type="submit"
                disabled={is_busy()}
              >
                <Formulary.SubmissionLabel
                  is_busy={is_busy()}
                  is_done={is_done()}
                  idle="Agregar"
                  busy="Agregando..."
                  done="Agregado"
                />
              </Button>
            {/snippet}
          </Formulary.Submission>
        </div>
      </form>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>

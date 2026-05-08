<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { destroy_income_guarantor } from "../forms/destroy_income_guarantor.remote"
  import { update_income_guarantor } from "../forms/update_income_guarantor.remote"

  interface Guarantor {
    id: number
    guarantor_name: string
    guarantor_dni: string
    guarantor_email: string
  }

  let {
    guarantor,
    contract_id,
    property_id,
  }: {
    guarantor: Guarantor
    contract_id: number
    property_id: number
  } = $props()

  const update_form = $derived(
    update_income_guarantor.for(guarantor.id),
  )
  const destroy_form = $derived(
    destroy_income_guarantor.for(guarantor.id),
  )
</script>

<li class="item-card">
  <form {...update_form}>
    <input type="hidden" name="id" value={guarantor.id} />
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
        <label for={`guarantor_name_${guarantor.id}`}
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
        <label for={`guarantor_dni_${guarantor.id}`}
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
        <label for={`guarantor_email_${guarantor.id}`}
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
      <Formulary.Submission form={update_form}>
        {#snippet children({ is_busy, is_done })}
          <Button
            variant="primary"
            type="submit"
            disabled={is_busy()}
          >
            <Formulary.SubmissionLabel
              is_busy={is_busy()}
              is_done={is_done()}
              idle="Guardar"
              busy="Guardando..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
    </div>
  </form>
  <form {...destroy_form}>
    <input type="hidden" name="id" value={guarantor.id} />
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
    <Formulary.Submission form={destroy_form}>
      {#snippet children({ is_busy, is_done })}
        <Button
          variant="secondary"
          type="submit"
          disabled={is_busy()}
        >
          <Formulary.SubmissionLabel
            is_busy={is_busy()}
            is_done={is_done()}
            idle="Eliminar"
            busy="Eliminando..."
            done="Eliminado"
          />
        </Button>
      {/snippet}
    </Formulary.Submission>
  </form>
</li>

<style>
  .item-card {
    border: 1px solid rgb(55 65 81);
    padding: 1rem;
    border-radius: 0.25rem;
  }
</style>

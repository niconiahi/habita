<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { update_contract_early_termination } from "../forms/update_contract_early_termination.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure
  name="sections"
  title="Sección 15: recesión anticipada"
>
  <form {...update_contract_early_termination}>
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
        <label for="early_termination">días de preaviso</label>
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
      <Formulary.Submission
        form={update_contract_early_termination}
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
              idle="Guardar recesión anticipada"
              busy="Guardando recesión anticipada..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
    </div>
  </form>
</Disclosure>

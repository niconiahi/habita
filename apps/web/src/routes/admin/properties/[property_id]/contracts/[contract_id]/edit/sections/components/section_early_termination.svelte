<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import SubmitLabel from "$lib/components/SubmitLabel.svelte"
  import { submission_disabled } from "$lib/submission_disabled"
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
      <Button
        variant="primary"
        type="submit"
        disabled={submission_disabled(
          update_contract_early_termination,
        )}
      >
        <SubmitLabel
          form={update_contract_early_termination}
          idle="Guardar recesión anticipada"
          busy="Guardando recesión anticipada..."
          done="Guardado"
        />
      </Button>
    </div>
  </form>
</Disclosure>

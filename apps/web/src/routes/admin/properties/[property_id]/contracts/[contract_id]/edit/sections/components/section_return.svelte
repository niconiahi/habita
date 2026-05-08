<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import SubmitLabel from "$lib/components/SubmitLabel.svelte"
  import { submission_disabled } from "$lib/submission_disabled"
  import { update_contract_return } from "../forms/update_contract_return.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure name="sections" title="Sección 14: devoluciones">
  <form {...update_contract_return}>
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
        disabled={submission_disabled(update_contract_return)}
      >
        <SubmitLabel
          form={update_contract_return}
          idle="Guardar porcentaje"
          busy="Guardando porcentaje..."
          done="Guardado"
        />
      </Button>
    </div>
  </form>
</Disclosure>

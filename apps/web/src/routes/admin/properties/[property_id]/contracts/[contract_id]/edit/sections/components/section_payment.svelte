<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import SubmitLabel from "$lib/components/SubmitLabel.svelte"
  import { submission_disabled } from "$lib/submission_disabled"
  import { update_contract_payment } from "../forms/update_contract_payment.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure name="sections" title="Sección 8: forma de pago">
  <form {...update_contract_payment}>
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
        disabled={submission_disabled(update_contract_payment)}
      >
        <SubmitLabel
          form={update_contract_payment}
          idle="Guardar CBU"
          busy="Guardando CBU..."
          done="Guardado"
        />
      </Button>
    </div>
  </form>
</Disclosure>

<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
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
      <Formulary.Submission form={update_contract_payment}>
        {#snippet children({ is_busy, is_done })}
          <Button
            variant="primary"
            type="submit"
            disabled={is_busy()}
          >
            <Formulary.SubmissionLabel
              is_busy={is_busy()}
              is_done={is_done()}
              idle="Guardar CBU"
              busy="Guardando CBU..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
    </div>
  </form>
</Disclosure>

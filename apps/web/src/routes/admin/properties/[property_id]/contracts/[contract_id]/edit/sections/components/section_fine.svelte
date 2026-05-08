<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { update_contract_fine } from "../forms/update_contract_fine.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure name="sections" title="Sección 9: mora">
  <form {...update_contract_fine}>
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
      <Formulary.Submission form={update_contract_fine}>
        {#snippet children({ is_busy, is_done })}
          <Button
            variant="primary"
            type="submit"
            disabled={is_busy()}
          >
            <Formulary.SubmissionLabel
              is_busy={is_busy()}
              is_done={is_done()}
              idle="Guardar porcentaje"
              busy="Guardando porcentaje..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
    </div>
  </form>
</Disclosure>

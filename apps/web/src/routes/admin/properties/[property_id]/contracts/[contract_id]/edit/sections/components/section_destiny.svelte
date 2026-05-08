<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import SubmitLabel from "$lib/components/SubmitLabel.svelte"
  import { get_property_destiny_label } from "$lib/property_destiny"
  import { submission_disabled } from "$lib/submission_disabled"
  import { update_contract_destiny } from "../forms/update_contract_destiny.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure name="sections" title="Sección 3: destino">
  <form {...update_contract_destiny}>
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
        disabled={submission_disabled(update_contract_destiny)}
      >
        <SubmitLabel
          form={update_contract_destiny}
          idle="Guardar destino"
          busy="Guardando destino..."
          done="Guardado"
        />
      </Button>
    </div>
  </form>
</Disclosure>

<style>
  .field-label {
    font-weight: 500;
  }
  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>

<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import SubmitLabel from "$lib/components/SubmitLabel.svelte"
  import { COURT, get_court_label } from "$lib/court"
  import { submission_disabled } from "$lib/submission_disabled"
  import { update_contract_jurisdiction } from "../forms/update_contract_jurisdiction.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure name="sections" title="Sección 21: jurisdicción">
  <form {...update_contract_jurisdiction}>
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
        <label for="court_id">tribunal</label>
        <select
          name="court_id"
          id="court_id"
          value={data.contract.court_id ?? ""}
        >
          {#each Object.values(COURT) as type}
            <option value={type}
              >{get_court_label(type)}</option
            >
          {/each}
        </select>
      </div>
    </div>
    <div class="form-actions">
      <Button
        variant="primary"
        type="submit"
        disabled={submission_disabled(
          update_contract_jurisdiction,
        )}
      >
        <SubmitLabel
          form={update_contract_jurisdiction}
          idle="Guardar jurisdicción"
          busy="Guardando jurisdicción..."
          done="Guardado"
        />
      </Button>
    </div>
  </form>
</Disclosure>

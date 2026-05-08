<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import SubmitLabel from "$lib/components/SubmitLabel.svelte"
  import {
    DURATIONS,
    get_duration_label,
  } from "$lib/duration"
  import {
    ESCALATION_TYPE,
    get_escalation_label,
  } from "$lib/escalation_type"
  import { submission_disabled } from "$lib/submission_disabled"
  import { update_contract_canon } from "../forms/update_contract_canon.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure name="sections" title="Sección 7: canon locativo">
  <form {...update_contract_canon}>
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
        <label for="escalation_type">tipo</label>
        <select
          name="escalation_type"
          id="escalation_type"
          value={data.contract.escalation_type ?? ""}
        >
          {#each Object.values(ESCALATION_TYPE) as type}
            <option value={type}
              >{get_escalation_label(type)}</option
            >
          {/each}
        </select>
        {#each update_contract_canon.fields.escalation_type.issues() as issue}
          <span class="form-error">{issue.message}</span>
        {/each}
      </div>
      <div class="form-field">
        <label for="escalation_duration">cada</label>
        <select
          name="escalation_duration"
          id="escalation_duration"
          value={data.contract.escalation_duration ?? ""}
        >
          {#each DURATIONS as duration}
            <option value={duration}
              >{get_duration_label(duration)}</option
            >
          {/each}
        </select>
        {#each update_contract_canon.fields.escalation_duration.issues() as issue}
          <span class="form-error">{issue.message}</span>
        {/each}
      </div>
    </div>
    <div class="form-actions">
      <Button
        variant="primary"
        type="submit"
        disabled={submission_disabled(update_contract_canon)}
      >
        <SubmitLabel
          form={update_contract_canon}
          idle="Guardar valores"
          busy="Guardando valores..."
          done="Guardado"
        />
      </Button>
    </div>
  </form>
</Disclosure>

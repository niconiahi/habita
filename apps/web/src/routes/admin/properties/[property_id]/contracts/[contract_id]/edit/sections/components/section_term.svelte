<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { format_date_for_input } from "$lib/date"
  import { update_contract_term } from "../forms/update_contract_term.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure name="sections" title="Sección 6: plazo">
  <form {...update_contract_term}>
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
        <label for="start_date">fecha de inicio</label>
        <input
          id="start_date"
          name="start_date"
          type="datetime-local"
          value={data.contract.start_date
            ? format_date_for_input(data.contract.start_date)
            : ""}
        />
        {#each update_contract_term.fields.start_date.issues() as issue}
          <span class="form-error">{issue.message}</span>
        {/each}
      </div>
      <div class="form-field">
        <label for="end_date">fecha de finalización</label>
        <input
          id="end_date"
          name="end_date"
          type="datetime-local"
          value={data.contract.end_date
            ? format_date_for_input(data.contract.end_date)
            : ""}
        />
        {#each update_contract_term.fields.end_date.issues() as issue}
          <span class="form-error">{issue.message}</span>
        {/each}
      </div>
    </div>
    <div class="form-actions">
      <Formulary.Submission form={update_contract_term}>
        {#snippet children({ is_busy, is_done })}
          <Button
            variant="primary"
            type="submit"
            disabled={is_busy()}
          >
            <Formulary.SubmissionLabel
              is_busy={is_busy()}
              is_done={is_done()}
              idle="Guardar plazo"
              busy="Guardando plazo..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
    </div>
  </form>
</Disclosure>

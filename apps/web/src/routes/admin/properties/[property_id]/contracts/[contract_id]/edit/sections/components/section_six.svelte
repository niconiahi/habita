<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { format_date_for_input } from "$lib/date"
  import {
    handle_disclosure_click,
    is_disclosure_open,
  } from "../disclosure_url"
  import { update_contract_term } from "../forms/update_contract_term.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const min_date = format_date_for_input(new Date())
  const start_field = update_contract_term.fields.start_date
  const end_field = update_contract_term.fields.end_date
</script>

<Disclosure
  name="section"
  open={is_disclosure_open("section", "six")}
  onclick={(event) =>
    handle_disclosure_click("section", "six", event)}
  title="Sección 6: plazo"
>
  <form
    {...update_contract_term.enhance(async ({ submit }) => {
      const ok = await submit()
      if (ok) await invalidateAll()
    })}
  >
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
          {...start_field.as(
            "datetime-local",
            data.contract.start_date
              ? format_date_for_input(
                  data.contract.start_date,
                )
              : "",
          )}
          min={min_date}
        />
        {#each start_field.issues() ?? [] as issue}
          <span class="form-error">{issue.message}</span>
        {/each}
      </div>
      <div class="form-field">
        <label for="end_date">fecha de finalización</label>
        <input
          id="end_date"
          {...end_field.as(
            "datetime-local",
            data.contract.end_date
              ? format_date_for_input(
                  data.contract.end_date,
                )
              : "",
          )}
          min={start_field.value() || min_date}
        />
        {#each end_field.issues() ?? [] as issue}
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

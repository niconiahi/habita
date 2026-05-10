<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import {
    DURATIONS,
    get_duration_label,
  } from "$lib/duration"
  import {
    ESCALATION_TYPE,
    get_escalation_label,
  } from "$lib/escalation_type"
  import { get_current_disclosure, set_current_disclosure } from "$lib/disclousure_cookie.remote"
  import { update_contract_canon } from "../forms/update_contract_canon.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("sections")
</script>

{#snippet errors(issues: { message: string }[] | undefined)}
  {#if issues}
    {#each issues as issue}
      <span class="form-error">{issue.message}</span>
    {/each}
  {/if}
{/snippet}

<Disclosure
  name="section"
  open={(await current) === "seven"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "sections",
      value: current.current === "seven" ? "" : "seven",
    })
  }}
  title="Sección 7: canon locativo"
>
  <form
    {...update_contract_canon.enhance(async ({ submit }) => {
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
        {@render errors(
          update_contract_canon.fields.escalation_type.issues(),
        )}
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
        {@render errors(
          update_contract_canon.fields.escalation_duration.issues(),
        )}
      </div>
    </div>
    <div class="form-actions">
      <Formulary.Submission form={update_contract_canon}>
        {#snippet children({ is_busy, is_done })}
          <Button
            variant="primary"
            type="submit"
            disabled={is_busy()}
          >
            <Formulary.SubmissionLabel
              is_busy={is_busy()}
              is_done={is_done()}
              idle="Guardar valores"
              busy="Guardando valores..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
    </div>
  </form>
</Disclosure>

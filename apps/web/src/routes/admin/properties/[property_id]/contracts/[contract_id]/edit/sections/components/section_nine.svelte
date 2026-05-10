<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { get_current_disclosure, set_current_disclosure } from "$lib/disclousure_cookie.remote"
  import { update_contract_fine } from "../forms/update_contract_fine.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("sections")

  const issues = $derived(
    update_contract_fine.fields.fine_amount.issues(),
  )
</script>

<Disclosure
  name="section"
  open={(await current) === "nine"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "sections",
      value: current.current === "nine" ? "" : "nine",
    })
  }}
  title="Sección 9: mora"
>
  <form
    {...update_contract_fine.enhance(async ({ submit }) => {
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
        <label for="fine_amount">porcentaje</label>
        <input
          id="fine_amount"
          name="fine_amount"
          type="number"
          value={data.contract.fine_amount ?? ""}
        />
        {#if issues}
          {#each issues as issue}
            <span class="form-error">{issue.message}</span>
          {/each}
        {/if}
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

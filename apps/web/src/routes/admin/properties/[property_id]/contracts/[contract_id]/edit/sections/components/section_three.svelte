<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { get_property_destiny_label } from "$lib/property_destiny"
  import { get_current_disclosure, set_current_disclosure } from "$lib/disclousure_cookie.remote"
  import { update_contract_destiny } from "../forms/update_contract_destiny.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("sections")

  const issues = $derived(
    update_contract_destiny.fields.destiny.issues(),
  )
</script>

<Disclosure
  name="section"
  open={(await current) === "three"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "sections",
      value: current.current === "three" ? "" : "three",
    })
  }}
  title="Sección 3: destino"
>
  <form
    {...update_contract_destiny.enhance(async ({ submit }) => {
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
        {#if issues}
          {#each issues as issue}
            <span class="form-error">{issue.message}</span>
          {/each}
        {/if}
      </div>
    </div>
    <div class="form-actions">
      <Formulary.Submission form={update_contract_destiny}>
        {#snippet children({ is_busy, is_done })}
          <Button
            variant="primary"
            type="submit"
            disabled={is_busy()}
          >
            <Formulary.SubmissionLabel
              is_busy={is_busy()}
              is_done={is_done()}
              idle="Guardar destino"
              busy="Guardando destino..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
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

<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import {
    get_current_disclosure,
    set_current_disclosure,
  } from "$lib/disclousure_cookie.remote"
  import { update_contract_return } from "../forms/update_contract_return.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("sections")
</script>

<Disclosure
  name="section"
  open={(await current) === "fourteen"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "sections",
      value:
        current.current === "fourteen" ? "" : "fourteen",
    })
  }}
  title="Sección 14: devoluciones"
>
  <form
    {...update_contract_return.enhance(
      async ({ submit }) => {
        const ok = await submit()
        if (ok) await invalidateAll()
      },
    )}
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
        <label for="percentage_return">porcentaje</label>
        <input
          id="percentage_return"
          name="percentage_return"
          type="number"
          step="0.1"
          required
          min="0.1"
          value={data.contract.percentage_return ?? ""}
        />
      </div>
    </div>
    <div class="form-actions">
      <Formulary.Submission form={update_contract_return}>
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

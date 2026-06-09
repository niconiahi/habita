<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import {
    get_current_disclosure,
    set_current_disclosure,
  } from "$lib/disclousure_cookie.remote"
  import { update_contract_showroom } from "../forms/update_contract_showroom.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("sections")
</script>

<Disclosure
  name="section"
  open={(await current) === "sixteen"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "sections",
      value: current.current === "sixteen" ? "" : "sixteen",
    })
  }}
  title="Sección 16: muestra de propiedad"
>
  <form
    {...update_contract_showroom.enhance(
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
        <label for="showroom_hours">cantidad de horas</label
        >
        <input
          id="showroom_hours"
          name="showroom_hours"
          type="number"
          step="1"
          required
          min="1"
          value={data.contract.showroom_hours ?? ""}
        />
      </div>
    </div>
    <div class="form-actions">
      <Formulary.Submission form={update_contract_showroom}>
        {#snippet children({ is_busy, is_done })}
          <Button
            variant="primary"
            type="submit"
            disabled={is_busy()}
          >
            <Formulary.SubmissionLabel
              is_busy={is_busy()}
              is_done={is_done()}
              idle="Guardar cantidad"
              busy="Guardando cantidad..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
    </div>
  </form>
</Disclosure>

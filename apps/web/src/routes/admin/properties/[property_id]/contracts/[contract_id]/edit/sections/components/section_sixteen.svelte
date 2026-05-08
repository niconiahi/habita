<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import {
    handle_disclosure_click,
    is_disclosure_open,
  } from "../disclosure_url"
  import { update_contract_showroom } from "../forms/update_contract_showroom.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure
  name="section"
  open={is_disclosure_open("section", "sixteen")}
  onclick={(event) =>
    handle_disclosure_click("section", "sixteen", event)}
  title="Sección 16: muestra de propiedad"
>
  <form
    {...update_contract_showroom.enhance(async ({ submit }) => {
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
        <label for="showroom_hours">cantidad de horas</label>
        <input
          id="showroom_hours"
          name="showroom_hours"
          type="number"
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

<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { COURT, get_court_label } from "$lib/court"
  import { get_current_disclosure, set_current_disclosure } from "$lib/disclousure_cookie.remote"
  import { update_contract_jurisdiction } from "../forms/update_contract_jurisdiction.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("sections")
</script>

<Disclosure
  name="section"
  open={(await current) === "twenty_one"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "sections",
      value: current.current === "twenty_one" ? "" : "twenty_one",
    })
  }}
  title="Sección 21: jurisdicción"
>
  <form
    {...update_contract_jurisdiction.enhance(
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
      <Formulary.Submission
        form={update_contract_jurisdiction}
      >
        {#snippet children({ is_busy, is_done })}
          <Button
            variant="primary"
            type="submit"
            disabled={is_busy()}
          >
            <Formulary.SubmissionLabel
              is_busy={is_busy()}
              is_done={is_done()}
              idle="Guardar jurisdicción"
              busy="Guardando jurisdicción..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
    </div>
  </form>
</Disclosure>

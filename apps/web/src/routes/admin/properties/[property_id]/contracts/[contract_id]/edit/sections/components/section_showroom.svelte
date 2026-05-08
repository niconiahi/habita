<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import SubmitLabel from "$lib/components/SubmitLabel.svelte"
  import { submission_disabled } from "$lib/submission_disabled"
  import { update_contract_showroom } from "../forms/update_contract_showroom.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()
</script>

<Disclosure
  name="sections"
  title="Sección 16: muestra de propiedad"
>
  <form {...update_contract_showroom}>
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
      <Button
        variant="primary"
        type="submit"
        disabled={submission_disabled(
          update_contract_showroom,
        )}
      >
        <SubmitLabel
          form={update_contract_showroom}
          idle="Guardar cantidad"
          busy="Guardando cantidad..."
          done="Guardado"
        />
      </Button>
    </div>
  </form>
</Disclosure>

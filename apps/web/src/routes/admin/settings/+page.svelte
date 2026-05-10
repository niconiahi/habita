<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import { compose_action } from "$lib/compose_action"
  import type { ActionData, PageData } from "./$types"
  import { ACTION } from "./actions/action"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()
</script>

<Content.Root>
  <Content.Title>Configuración</Content.Title>

  <Content.Section>
    <Formulary.Root
      action={compose_action(
        ACTION.UPDATE_ORGANIZATION_NAME,
      )}
      method="POST"
    >
      {#snippet children({ submit_state })}
        <Formulary.Input
          label="Nombre"
          name="name"
          value={data.organization.name}
          error={form?.errors?.nested?.name?.[0] ??
            form?.message}
          required
        />
        <Formulary.Actions>
          <Button
            variant="primary"
            type="submit"
            disabled={submit_state === "busy"}
          >
            <Formulary.SubmitLabel
              state={submit_state}
              idle="Guardar"
              busy="Guardando..."
            done="Guardado"
            />
          </Button>
        </Formulary.Actions>
      {/snippet}
    </Formulary.Root>
  </Content.Section>
</Content.Root>

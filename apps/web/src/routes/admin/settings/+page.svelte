<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import { compose_action } from "$lib/compose_action"
  import type { ActionData, PageData } from "./$types"
  import { ACTION } from "./actions/action"

  let {
    data,
    form,
  }: { data: PageData; form: ActionData } = $props()
</script>

<Content.Root>
  <Content.Title>Configuración</Content.Title>

  <Content.Section>
    <Section.Header>
      <Section.Title>Organización</Section.Title>
    </Section.Header>
    <Formulary.Root
      action={compose_action(ACTION.UPDATE_ORGANIZATION_NAME)}
      method="POST"
    >
      <Formulary.Input
        label="Nombre"
        name="name"
        value={data.organization.name}
        error={form?.errors?.nested?.name?.[0] ??
          form?.message}
        required
      />
      <Formulary.Actions>
        <Button variant="primary" type="submit">
          Guardar
        </Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
</Content.Root>

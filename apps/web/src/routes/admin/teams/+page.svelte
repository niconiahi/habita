<script lang="ts">
  import { enhance } from "$app/forms"
  import Button from "$lib/components/Button.svelte"
  import * as Content from "$lib/components/Content"
  import * as Formulary from "$lib/components/Formulary"
  import * as Section from "$lib/components/Section"
  import * as Table from "$lib/components/Table"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { ActionData, PageData } from "./$types"

  let {
    data,
    form,
  }: { data: PageData; form: ActionData } = $props()

  const date_formatter = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Argentina/Buenos_Aires",
  })

  function format_short_date(value: Date | string) {
    return date_formatter.format(new Date(value))
  }
</script>

<Content.Root>
  <Content.Title>Equipos</Content.Title>

  <Content.Section>
    <Section.Header>
      <Section.Title>Crear equipo</Section.Title>
    </Section.Header>
    <form
      method="POST"
      action={compose_action(ACTION.CREATE_TEAM)}
      use:enhance
      class="create-form"
    >
      <Formulary.Field>
        <Formulary.Label for="name">Nombre</Formulary.Label>
        <input
          type="text"
          id="name"
          name="name"
          required
          maxlength="50"
          placeholder="Equipo Norte"
        />
        {#if form?.errors?.nested?.name?.[0]}
          <Formulary.Error
            >{form.errors.nested.name[0]}</Formulary.Error
          >
        {/if}
      </Formulary.Field>
      <Button variant="primary" type="submit">Crear</Button>
    </form>
    {#if form?.message}
      <p class="form-message">{form.message}</p>
    {/if}
  </Content.Section>

  <Content.Section>
    <Section.Header>
      <Section.Title
        >{data.organization.name}</Section.Title
      >
    </Section.Header>
    {#if data.teams.length === 0}
      <p class="empty-state">
        No hay equipos en tu organizacion todavia.
      </p>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Nombre</Table.Cell>
          <Table.Cell header>Miembros</Table.Cell>
          <Table.Cell header>Creado</Table.Cell>
        </Table.Header>
        <Table.Body>
          {#each data.teams as team (team.id)}
            <Table.Row>
              <Table.Cell>
                <a class="team-link" href="/admin/teams/{team.id}"
                  >{team.name}</a
                >
              </Table.Cell>
              <Table.Cell>{team.member_count}</Table.Cell>
              <Table.Cell
                >{format_short_date(
                  team.created_at,
                )}</Table.Cell
              >
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
  </Content.Section>
</Content.Root>

<style>
  .create-form {
    display: flex;
    gap: var(--dimension-spacing-4);
    align-items: flex-end;
  }

  .empty-state {
    color: var(--color-text-body);
    font-style: italic;
  }

  .form-message {
    color: var(--color-text-error);
  }

  .team-link {
    color: var(--color-text-link);
  }
</style>

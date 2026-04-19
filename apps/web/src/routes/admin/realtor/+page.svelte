<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Table from "$lib/components/Table"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  function display_name(user: {
    name: string | null
    surname: string | null
  }) {
    return [user.name, user.surname]
      .filter(Boolean)
      .join(" ")
  }
</script>

<Content.Root>
  <Content.Title>Gestion de Inmobiliaria</Content.Title>

  <Content.Section>
    <Section.Header>
      <Section.Title
        >Organizacion: {data.organization
          .name}</Section.Title
      >
    </Section.Header>
  </Content.Section>

  <Content.Section>
    <Section.Header>
      <Section.Title>Invitar Gestor</Section.Title>
    </Section.Header>
    <form
      method="POST"
      action={compose_action(ACTION.INVITE_MANAGER)}
      use:enhance
      class="invite-form"
    >
      <Formulary.Field>
        <Formulary.Label for="email">Email</Formulary.Label>
        <input
          type="email"
          id="email"
          name="email"
          required
          placeholder="gestor@ejemplo.com"
        />
      </Formulary.Field>
      <Button variant="primary" type="submit">Enviar Invitacion</Button>
    </form>
  </Content.Section>

  <Content.Section>
    <Section.Header>
      <Section.Title>Gestores</Section.Title>
    </Section.Header>
    {#if data.managers.length === 0}
      <p class="empty-state">
        No hay gestores en tu organizacion todavia.
      </p>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Nombre</Table.Cell>
          <Table.Cell header>Email</Table.Cell>
          <Table.Cell header
            >Propiedades Asignadas</Table.Cell
          >
          <Table.Cell header>Acciones</Table.Cell>
        </Table.Header>
        <Table.Body>
          {#each data.managers as manager (manager.id)}
            <Table.Row>
              <Table.Cell
                >{display_name(manager)}</Table.Cell
              >
              <Table.Cell>{manager.email}</Table.Cell>
              <Table.Cell
                >{manager.property_count}</Table.Cell
              >
              <Table.Cell>
                <form
                  method="POST"
                  action={compose_action(
                    ACTION.REMOVE_MANAGER,
                  )}
                  use:enhance
                  style="display: inline;"
                >
                  <input
                    type="hidden"
                    name="manager_id"
                    value={manager.id}
                  />
                  <Button variant="secondary" type="submit">Remover</Button>
                </form>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
  </Content.Section>
</Content.Root>

<style>
  .invite-form {
    display: flex;
    gap: 1rem;
    align-items: flex-end;
  }

  .empty-state {
    color: var(--color-gray-500);
    font-style: italic;
  }
</style>

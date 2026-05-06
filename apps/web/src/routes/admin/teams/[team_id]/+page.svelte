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

  function display_name(member: {
    name: string | null
    surname: string | null
    email: string
  }) {
    const composed = [member.name, member.surname]
      .filter(Boolean)
      .join(" ")
    return composed || member.email
  }
</script>

<Content.Root>
  <Content.Title>{data.team.name}</Content.Title>

  <Content.Section>
    <Section.Header>
      <Section.Title>Invitar al equipo</Section.Title>
    </Section.Header>
    <form
      method="POST"
      action={compose_action(ACTION.INVITE_TO_TEAM)}
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
        {#if form?.errors?.nested?.email?.[0]}
          <Formulary.Error
            >{form.errors.nested.email[0]}</Formulary.Error
          >
        {/if}
      </Formulary.Field>
      <Button variant="primary" type="submit"
        >Enviar invitacion</Button
      >
    </form>
    {#if form?.message}
      <p class="form-message">{form.message}</p>
    {/if}
  </Content.Section>

  <Content.Section>
    <Section.Header>
      <Section.Title>Miembros</Section.Title>
    </Section.Header>
    {#if data.members.length === 0}
      <p class="empty-state">
        Este equipo no tiene miembros todavia.
      </p>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Nombre</Table.Cell>
          <Table.Cell header>Email</Table.Cell>
          <Table.Cell header>Propiedades</Table.Cell>
          <Table.Cell header>Acciones</Table.Cell>
        </Table.Header>
        <Table.Body>
          {#each data.members as member (member.id)}
            <Table.Row>
              <Table.Cell>
                <a
                  class="member-link"
                  href="/admin/teams/{data.team
                    .id}/members/{member.id}"
                  >{display_name(member)}</a
                >
              </Table.Cell>
              <Table.Cell>{member.email}</Table.Cell>
              <Table.Cell
                >{member.property_count}</Table.Cell
              >
              <Table.Cell>
                <form
                  method="POST"
                  action={compose_action(
                    ACTION.REMOVE_FROM_TEAM,
                  )}
                  use:enhance
                  style="display: inline;"
                >
                  <input
                    type="hidden"
                    name="user_id"
                    value={member.id}
                  />
                  <Button variant="secondary" type="submit"
                    >Remover</Button
                  >
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

  .member-link {
    color: var(--color-text-link);
  }
</style>

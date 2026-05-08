<script lang="ts">
  import { enhance } from "$app/forms"
  import Button from "$lib/components/Button.svelte"
  import * as Dialog from "$lib/components/Dialog"
  import * as Formulary from "$lib/components/Formulary"
  import * as Table from "$lib/components/Table"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { ActionData, PageData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()

  let dialog_element: HTMLDialogElement | undefined =
    $state()

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

<div class="page">
  <div class="header">
    <h1 class="heading-md title">Equipos</h1>
    <Button
      variant="primary"
      onclick={() => dialog_element?.showModal()}
    >
      Crear equipo
    </Button>
  </div>
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
              <a href="/admin/teams/{team.id}"
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
</div>

<Dialog.Root bind:element={dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Crear equipo</Dialog.Title>
        <Dialog.Close onclick={close} />
      </Dialog.Header>
      <form
        method="POST"
        action={compose_action(ACTION.CREATE_TEAM)}
        class="form"
        use:enhance={() => {
          return async ({ update }) => {
            await update({ reset: false })
            close()
          }
        }}
      >
        <Formulary.Field>
          <Formulary.Label for="name"
            >Nombre</Formulary.Label
          >
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
        {#if form?.message}
          <p class="form-message">{form.message}</p>
        {/if}
        <Dialog.Actions>
          <Button
            variant="secondary"
            type="button"
            onclick={close}
          >
            Cancelar
          </Button>
          <Button variant="primary" type="submit"
            >Crear</Button
          >
        </Dialog.Actions>
      </form>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .title {
    color: var(--color-text-heading);
  }

  .empty-state {
    color: var(--color-text-body);
    font-style: italic;
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .form-message {
    color: var(--color-text-error);
  }
</style>

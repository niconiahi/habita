<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Breadcrumb from "$lib/components/Breadcrumb"
  import Button from "$lib/components/Button.svelte"
  import * as Dialog from "$lib/components/Dialog"
  import * as Formulary from "$lib/components/Formulary"
  import * as Table from "$lib/components/Table"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { ActionData, PageData } from "./$types"

  let {
    data,
    form,
  }: { data: PageData; form: ActionData } = $props()

  let invite_dialog_element: HTMLDialogElement | undefined =
    $state()
  let edit_dialog_element: HTMLDialogElement | undefined =
    $state()
  let destroy_dialog_element: HTMLDialogElement | undefined =
    $state()

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

  function format_expires(expires_at: Date | string): string {
    const expires_ms = new Date(expires_at).getTime()
    const days = Math.ceil(
      (expires_ms - Date.now()) / (1000 * 60 * 60 * 24),
    )
    if (days <= 0) return "Hoy"
    if (days === 1) return "Mañana"
    return `En ${days} días`
  }
</script>

<div class="page">
  <Breadcrumb.Root>
    <Breadcrumb.Link href="/admin/teams"
      >Equipos</Breadcrumb.Link
    >
    <Breadcrumb.Current>{data.team.name}</Breadcrumb.Current>
  </Breadcrumb.Root>
  <div class="header">
    <h1 class="heading-md title">{data.team.name}</h1>
    <div class="header-actions">
      <Button
        variant="secondary"
        onclick={() => edit_dialog_element?.showModal()}
      >
        Editar nombre
      </Button>
      <Button
        variant="primary"
        onclick={() => invite_dialog_element?.showModal()}
      >
        Invitar al equipo
      </Button>
      <Button
        variant="secondary"
        onclick={() => destroy_dialog_element?.showModal()}
      >
        Eliminar equipo
      </Button>
    </div>
  </div>
  {#if form?.success}
    <p class="success-banner">Invitación enviada</p>
  {/if}
  {#if data.pending_invitations.length > 0}
    <section class="section">
      <h2 class="heading-sm section-title">
        Invitaciones pendientes
      </h2>
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Email</Table.Cell>
          <Table.Cell header>Expira</Table.Cell>
          <Table.Cell header>Acciones</Table.Cell>
        </Table.Header>
        <Table.Body>
          {#each data.pending_invitations as invitation (invitation.id)}
            <Table.Row>
              <Table.Cell>{invitation.email}</Table.Cell>
              <Table.Cell
                >{format_expires(
                  invitation.expires_at,
                )}</Table.Cell
              >
              <Table.Cell>
                <form
                  method="POST"
                  action={compose_action(
                    ACTION.CANCEL_INVITATION,
                  )}
                  use:enhance
                  style="display: inline;"
                >
                  <input
                    type="hidden"
                    name="invitation_id"
                    value={invitation.id}
                  />
                  <Button
                    variant="secondary"
                    type="submit"
                  >
                    Cancelar invitación
                  </Button>
                </form>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    </section>
  {/if}
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
                href="/admin/teams/{data.team
                  .id}/members/{member.id}"
                >{display_name(member)}</a
              >
            </Table.Cell>
            <Table.Cell>{member.email}</Table.Cell>
            <Table.Cell>{member.property_count}</Table.Cell>
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
</div>

<Dialog.Root bind:element={invite_dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Invitar al equipo</Dialog.Title>
        <Dialog.Close onclick={close} />
      </Dialog.Header>
      <form
        method="POST"
        action={compose_action(ACTION.INVITE_TO_TEAM)}
        class="form"
        use:enhance={() => {
          return async ({ update }) => {
            await update({ reset: false })
            close()
          }
        }}
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
            >Enviar invitacion</Button
          >
        </Dialog.Actions>
      </form>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>

<Dialog.Root bind:element={edit_dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Editar nombre del equipo</Dialog.Title>
        <Dialog.Close onclick={close} />
      </Dialog.Header>
      <form
        method="POST"
        action={compose_action(ACTION.UPDATE_TEAM_NAME)}
        class="form"
        use:enhance={() => {
          return async ({ update }) => {
            await update({ reset: false })
            close()
          }
        }}
      >
        <Formulary.Field>
          <Formulary.Label for="name">Nombre</Formulary.Label>
          <input
            type="text"
            id="name"
            name="name"
            required
            maxlength="50"
            value={data.team.name}
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
            >Guardar</Button
          >
        </Dialog.Actions>
      </form>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>

<Dialog.Root bind:element={destroy_dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Eliminar equipo</Dialog.Title>
        <Dialog.Close onclick={close} />
      </Dialog.Header>
      {#if data.members.length > 0}
        <p class="body-md-medium dialog-message">
          El equipo tiene {data.members.length}
          {data.members.length === 1
            ? "miembro"
            : "miembros"}. Removelos antes de eliminarlo
          para evitar propiedades sin gestor.
        </p>
        <Dialog.Actions>
          <Button
            variant="secondary"
            type="button"
            onclick={close}
          >
            Cancelar
          </Button>
        </Dialog.Actions>
      {:else}
        <p class="body-md-medium dialog-message">
          Esta acción no se puede deshacer. El equipo será
          eliminado permanentemente.
        </p>
        <form
          method="POST"
          action={compose_action(ACTION.DESTROY_TEAM)}
          use:enhance={() => {
            return async ({ update }) => {
              await update()
              close()
            }
          }}
        >
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
              >Eliminar</Button
            >
          </Dialog.Actions>
        </form>
      {/if}
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

  .header-actions {
    display: flex;
    gap: var(--dimension-spacing-2);
  }

  .title {
    color: var(--color-text-heading);
  }

  .empty-state {
    color: var(--color-text-body);
    font-style: italic;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .section-title {
    color: var(--color-text-heading);
  }

  .success-banner {
    color: var(--color-text-success, var(--color-text-body));
    background-color: var(
      --color-surface-success,
      var(--color-absolute-white)
    );
    padding: var(--dimension-spacing-3)
      var(--dimension-spacing-4);
    border-radius: var(--dimension-radius-2);
    border: 1px solid
      var(--color-border-success, var(--color-border-primary));
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .form-message {
    color: var(--color-text-error);
  }

  .dialog-message {
    color: var(--color-text-body);
  }
</style>

<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Breadcrumb from "$lib/components/Breadcrumb"
  import Button from "$lib/components/Button.svelte"
  import * as Dialog from "$lib/components/Dialog"
  import * as Table from "$lib/components/Table"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { ActionData, PageData } from "./$types"

  let {
    data,
    form,
  }: { data: PageData; form: ActionData } = $props()

  let dialog_element: HTMLDialogElement | undefined =
    $state()
  let pending_property_id: number | null = $state(null)
  let pending_new_manager_id: string = $state("")

  function display_name(user: {
    name: string | null
    surname: string | null
    email: string
  }) {
    const composed = [user.name, user.surname]
      .filter(Boolean)
      .join(" ")
    return composed || user.email
  }

  function open_reassign(property_id: number) {
    pending_property_id = property_id
    pending_new_manager_id = ""
    dialog_element?.showModal()
  }
</script>

<div class="page">
  <Breadcrumb.Root>
    <Breadcrumb.Link href="/admin/teams"
      >Equipos</Breadcrumb.Link
    >
    <Breadcrumb.Link href="/admin/teams/{data.team.id}"
      >{data.team.name}</Breadcrumb.Link
    >
    <Breadcrumb.Current
      >{display_name(data.member)}</Breadcrumb.Current
    >
  </Breadcrumb.Root>
  <div class="header">
    <h1 class="heading-md title">
      {display_name(data.member)}
    </h1>
  </div>

  <section class="section">
    <h2 class="heading-sm section-title">Detalles</h2>
    <dl class="details">
      <div>
        <dt>Email</dt>
        <dd>{data.member.email}</dd>
      </div>
      <div>
        <dt>Equipo</dt>
        <dd>
          <a href="/admin/teams/{data.team.id}"
            >{data.team.name}</a
          >
        </dd>
      </div>
    </dl>
  </section>

  <section class="section">
    <h2 class="heading-sm section-title">
      Propiedades gestionadas
    </h2>
    {#if data.properties.length === 0}
      <p class="empty-state">
        Este miembro no esta gestionando ninguna propiedad.
      </p>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Direccion</Table.Cell>
          <Table.Cell header>Unidad</Table.Cell>
          <Table.Cell header>Acciones</Table.Cell>
        </Table.Header>
        <Table.Body>
          {#each data.properties as property (property.id)}
            <Table.Row>
              <Table.Cell>{property.address}</Table.Cell>
              <Table.Cell>{property.unit ?? "-"}</Table.Cell>
              <Table.Cell>
                <Button
                  variant="secondary"
                  type="button"
                  onclick={() =>
                    open_reassign(property.id)}
                >
                  Reasignar
                </Button>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
    {#if form?.message}
      <p class="form-message">{form.message}</p>
    {/if}
  </section>
</div>

<Dialog.Root bind:element={dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Reasignar propiedad</Dialog.Title>
        <Dialog.Close
          onclick={() => {
            close()
            pending_property_id = null
          }}
        />
      </Dialog.Header>
      <form
        method="POST"
        action={compose_action(ACTION.REASSIGN_PROPERTY)}
        class="form"
        use:enhance={() => {
          return async ({ update }) => {
            await update()
            close()
            pending_property_id = null
          }
        }}
      >
        <input
          type="hidden"
          name="property_id"
          value={pending_property_id}
        />
        <label class="body-sm-bold field-label" for="new_manager_id"
          >Nuevo gestor</label
        >
        <select
          id="new_manager_id"
          name="new_manager_id"
          bind:value={pending_new_manager_id}
        >
          <option value="">Sin gestor</option>
          {#each data.peers as peer (peer.id)}
            <option value={peer.id}
              >{display_name(peer)}</option
            >
          {/each}
        </select>
        <Dialog.Actions>
          <Button
            variant="secondary"
            type="button"
            onclick={() => {
              close()
              pending_property_id = null
            }}
          >
            Cancelar
          </Button>
          <Button variant="primary" type="submit"
            >Reasignar</Button
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

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .section-title {
    color: var(--color-text-heading);
  }

  .details {
    display: grid;
    gap: var(--dimension-spacing-2);
  }

  .details > div {
    display: flex;
    gap: var(--dimension-spacing-3);
  }

  .details dt {
    color: var(--color-text-body);
    font-weight: 600;
  }

  .empty-state {
    color: var(--color-text-body);
    font-style: italic;
  }

  .form-message {
    color: var(--color-text-error);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .field-label {
    color: var(--color-text-body);
  }
</style>

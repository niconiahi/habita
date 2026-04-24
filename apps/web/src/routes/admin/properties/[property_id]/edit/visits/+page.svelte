<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Dialog from "$lib/components/Dialog"
  import * as Table from "$lib/components/Table"
  import Button from "$lib/components/Button.svelte"
  import {
    get_slot_state_label,
    SLOT_STATE,
  } from "$lib/slot_state"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  let dialog_element: HTMLDialogElement | undefined =
    $state()

  function format_date(date: Date): string {
    return date.toLocaleDateString("es-AR")
  }

  function format_time(date: Date): string {
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
</script>

<section class="root">
  <div class="header">
    <h2 class="heading-sm tab-title">Visitas</h2>
    <Button
      variant="primary"
      onclick={() => dialog_element?.showModal()}
      >Agregar horario</Button
    >
  </div>
  {#if data.slots.length > 0}
    <Table.Root>
      <Table.Header>
        <Table.Cell header>Fecha</Table.Cell>
        <Table.Cell header>Hora inicio</Table.Cell>
        <Table.Cell header>Hora fin</Table.Cell>
        <Table.Cell header>Estado</Table.Cell>
        <Table.Cell header>&nbsp;</Table.Cell>
      </Table.Header>
      <Table.Body>
        {#each data.slots as slot (slot.id)}
          <Table.Row>
            <Table.Cell>
              {format_date(slot.start_date)}
            </Table.Cell>
            <Table.Cell>
              {format_time(slot.start_date)}
            </Table.Cell>
            <Table.Cell>
              {format_time(slot.end_date)}
            </Table.Cell>
            <Table.Cell>
              {get_slot_state_label(slot.state)}
            </Table.Cell>
            <Table.Cell>
              {#if slot.state === SLOT_STATE.FREE}
                <form
                  method="POST"
                  action={`?/${ACTION.DESTROY_SLOT}`}
                  use:enhance
                >
                  <input
                    type="hidden"
                    name="id"
                    value={slot.id}
                  />
                  <Button variant="secondary" type="submit"
                    >Eliminar</Button
                  >
                </form>
              {/if}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  {:else}
    <p class="body-md-medium empty">
      No hay horarios creados
    </p>
  {/if}
</section>

<Dialog.Root bind:element={dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Agregar horario</Dialog.Title>
        <Dialog.Close onclick={close} />
      </Dialog.Header>
      <form
        method="POST"
        action={`?/${ACTION.CREATE_SLOT}`}
        class="form"
        use:enhance={() => {
          return async ({ update }) => {
            await update({ reset: false })
            close()
          }
        }}
      >
        <div class="fields">
          <div class="field">
            <label class="body-sm-bold" for="date"
              >Fecha</label
            >
            <input
              type="date"
              id="date"
              name="date"
              required
            />
          </div>
          <div class="field">
            <label class="body-sm-bold" for="start_time"
              >Hora inicio</label
            >
            <input
              type="time"
              id="start_time"
              name="start_time"
              required
            />
          </div>
          <div class="field">
            <label class="body-sm-bold" for="end_time"
              >Hora fin</label
            >
            <input
              type="time"
              id="end_time"
              name="end_time"
              required
            />
          </div>
        </div>
        <Button variant="primary" type="submit"
          >Crear horario</Button
        >
      </form>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>

<style>
  .root {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .tab-title {
    color: var(--color-text-heading);
  }

  .empty {
    color: var(--color-text-body);
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .fields {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
  }
</style>

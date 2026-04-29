<script lang="ts">
  import { enhance } from "$app/forms"
  import { startOfMonth } from "date-fns"
  import * as Table from "$lib/components/Table"
  import * as Dialog from "$lib/components/Dialog"
  import Button from "$lib/components/Button.svelte"
  import {
    get_receipt_type_label,
    type ReceiptType,
  } from "$lib/receipt_type"
  import { display_date } from "$lib/display_date"
  import { compose_action } from "$lib/compose_action"
  import type { PageData } from "./$types"
  import { ACTION } from "./actions/action"

  let { data }: { data: PageData } = $props()

  let confirm_dialog_element: HTMLDialogElement | undefined =
    $state()
  let pending_receipt_id: number | null = $state(null)

  function is_current_month(date: Date | string) {
    return (
      startOfMonth(new Date(date)).getTime() ===
      startOfMonth(new Date()).getTime()
    )
  }
</script>

<section>
  <h2 class="heading-sm tab-title">
    Comprobantes del inquilino
  </h2>
  {#if data.receipts.length > 0}
    <Table.Root>
      <Table.Header>
        <Table.Cell header>Tipo</Table.Cell>
        <Table.Cell header>Archivo</Table.Cell>
        <Table.Cell header>Fecha</Table.Cell>
        <Table.Cell header>Acciones</Table.Cell>
      </Table.Header>
      <Table.Body>
        {#each data.receipts as receipt (receipt.id)}
          <Table.Row>
            <Table.Cell>
              {get_receipt_type_label(receipt.type as ReceiptType)}
            </Table.Cell>
            <Table.Cell>
              <a
                href="/files/{receipt.file_id}"
                target="_blank"
                rel="noopener noreferrer"
              >
                {receipt.basename}
              </a>
            </Table.Cell>
            <Table.Cell>
              {display_date(new Date(receipt.created_at))}
            </Table.Cell>
            <Table.Cell>
              {#if is_current_month(receipt.created_at)}
                <Button
                  variant="tertiary"
                  squared
                  type="button"
                  aria-label="Eliminar comprobante"
                  onclick={() => {
                    pending_receipt_id = receipt.id
                    confirm_dialog_element?.showModal()
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6"
                    ></polyline>
                    <path
                      d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                    ></path>
                  </svg>
                </Button>
              {/if}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  {:else}
    <p class="body-md-medium empty">
      No hay comprobantes cargados
    </p>
  {/if}
</section>

<Dialog.Root bind:element={confirm_dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Eliminar comprobante</Dialog.Title>
        <Dialog.Close
          onclick={() => {
            close()
            pending_receipt_id = null
          }}
        />
      </Dialog.Header>
      <p class="body-md-medium dialog-message">
        Esta acción no se puede deshacer. El comprobante
        será eliminado permanentemente.
      </p>
      <div class="dialog-actions">
        <Button
          variant="secondary"
          type="button"
          onclick={() => {
            close()
            pending_receipt_id = null
          }}
        >
          Cancelar
        </Button>
        <form
          method="POST"
          action={compose_action(ACTION.DELETE_RECEIPT)}
          use:enhance={() => {
            return async ({ update }) => {
              await update()
              close()
              pending_receipt_id = null
            }
          }}
        >
          <input
            type="hidden"
            name="receipt_id"
            value={pending_receipt_id}
          />
          <Button variant="primary" type="submit">
            Eliminar
          </Button>
        </form>
      </div>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>

<style>
  .tab-title {
    color: var(--color-text-heading);
  }

  .dialog-message {
    color: var(--color-text-body);
  }

  .dialog-actions {
    display: flex;
    gap: var(--dimension-spacing-3);
    justify-content: flex-end;
    padding-top: var(--dimension-spacing-4);
  }

  .empty {
    color: var(--color-text-body);
  }
</style>

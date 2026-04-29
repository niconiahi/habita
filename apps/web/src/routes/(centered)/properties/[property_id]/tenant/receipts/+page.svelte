<script lang="ts">
  import { enhance } from "$app/forms"
  import { startOfMonth } from "date-fns"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Dialog from "$lib/components/Dialog"
  import Button from "$lib/components/Button.svelte"
  import { display_date } from "$lib/display_date"
  import {
    get_receipt_type_label,
    type ReceiptType,
  } from "$lib/receipt_type"
  import { compose_action } from "$lib/compose_action"
  import WhatsappButton from "$lib/components/WhatsappButton.svelte"
  import type { PageData } from "./$types"
  import { ACTION } from "./actions/action"

  let { data }: { data: PageData } = $props()

  let delete_dialog_element: HTMLDialogElement | undefined =
    $state()

  function get_receipt_for_month_and_type(
    date: Date,
    type: ReceiptType,
  ) {
    return data.receipts.find((receipt) => {
      const creation_date = startOfMonth(
        new Date(receipt.created_at),
      )
      const current_date = startOfMonth(date)
      return (
        receipt.type === type &&
        creation_date.getTime() === current_date.getTime()
      )
    })
  }

  function handle_file_change(
    form_element: HTMLFormElement,
  ) {
    form_element.requestSubmit()
  }

  function is_current_month(date: Date) {
    return (
      startOfMonth(date).getTime() ===
      startOfMonth(new Date()).getTime()
    )
  }
</script>

{#each data.dates as date (date.toISOString())}
  {@const is_editable = is_current_month(date)}
  <Content.Section>
    <Section.Header>
      <Section.Title>
        {display_date(date, {
          day: undefined,
          month: "long",
          year: "numeric",
          hour: undefined,
          minute: undefined,
        })}
      </Section.Title>
    </Section.Header>
    <ul class="receipt-list">
      {#each data.receipt_types as type (type)}
        {@const receipt = get_receipt_for_month_and_type(
          date,
          type,
        )}
        {@const label = get_receipt_type_label(type)}
        {#if receipt || is_editable}
        <li class="receipt-item">
          <span class="receipt-label">{label}</span>
          {#if receipt}
            <a
              href="/files/{receipt.file_id}"
              target="_blank"
              rel="noopener noreferrer"
            >
              Descargar
            </a>
            <Button
              variant="secondary"
              squared
              type="button"
              onclick={() =>
                delete_dialog_element?.showModal()}
              aria-label="Solicitar eliminación"
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
                <polyline points="3 6 5 6 21 6"></polyline>
                <path
                  d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
                ></path>
              </svg>
            </Button>
          {:else if is_editable}
            {@const input_id = `file_${date.getTime()}_${type}`}
            <form
              method="POST"
              action={compose_action(
                ACTION.UPLOAD_RECEIPT,
              )}
              enctype="multipart/form-data"
              use:enhance
            >
              <input
                type="hidden"
                name="contract_id"
                value={data.contract.id}
              />
              <input
                type="hidden"
                name="type"
                value={type}
              />
              <input
                id={input_id}
                type="file"
                name="file"
                required
                accept="image/*,application/pdf"
                class="sr-only"
                onchange={(event) => {
                  const form_element =
                    event.currentTarget.form
                  if (form_element) {
                    handle_file_change(form_element)
                  }
                }}
              />
              <Button
                variant="primary"
                type="button"
                onclick={() =>
                  document
                    .getElementById(input_id)
                    ?.click()}
              >
                Subir archivo
              </Button>
            </form>
          {/if}
        </li>
        {/if}
      {/each}
    </ul>
  </Content.Section>
{/each}

{#if data.next_day}
  <div class="load-more">
    <a href="?day={data.next_day}">
      <Button variant="secondary" type="button">
        Cargar más
      </Button>
    </a>
  </div>
{/if}

<Dialog.Root bind:element={delete_dialog_element}>
  {#snippet children({ close })}
    <Dialog.Content>
      <Dialog.Header>
        <Dialog.Title>Eliminar comprobante</Dialog.Title>
        <Dialog.Close onclick={close} />
      </Dialog.Header>
      <p class="body-md-medium dialog-message">
        Para eliminar un comprobante, contactá a tu
        administrador.
      </p>
      <div class="dialog-actions">
        <Button
          variant="secondary"
          type="button"
          onclick={close}
        >
          Cancelar
        </Button>
        {#if data.manager?.phone_number}
          <WhatsappButton
            phone_number={data.manager.phone_number}
          >
            Enviar mensaje
          </WhatsappButton>
        {/if}
      </div>
    </Dialog.Content>
  {/snippet}
</Dialog.Root>

<style>
  .receipt-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .receipt-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .receipt-label {
    font-weight: 500;
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

  .load-more {
    display: flex;
    justify-content: center;
    padding-top: var(--dimension-spacing-4);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>

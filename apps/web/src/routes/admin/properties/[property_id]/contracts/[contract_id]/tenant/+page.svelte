<script lang="ts">
  import { startOfMonth } from "date-fns"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import Button from "$lib/components/Button.svelte"
  import { display_date } from "$lib/display_date"
  import {
    get_receipt_type_label,
    type ReceiptType,
  } from "$lib/receipt_type"
  import { compose_action } from "$lib/compose_action"
  import type { PageData } from "./$types"
  import { ACTION } from "./actions/action"
  let { data }: { data: PageData } = $props()
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
</script>

<Content.Root>
  <Content.Title>Comprobantes de pago</Content.Title>
  <Content.Section>
    <Section.Header>
      <Section.Title
        >Precio de alquiler actual</Section.Title
      >
    </Section.Header>
    <p>${data.current_rent_price}</p>
  </Content.Section>
  {#each data.dates as date (date.toISOString())}
    <Content.Section>
      <Section.Header>
        <Section.Title>
          {display_date(date, {
            month: "long",
            year: "numeric",
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
          <li class="receipt-item">
            <span class="receipt-label">{label}</span>
            {#if receipt}
              <a
                href="/files/{receipt.file_id}"
                target="_blank"
                rel="noopener noreferrer"
                class="download-link"
              >
                Descargar
              </a>
            {:else}
              <form
                method="POST"
                action={compose_action(
                  ACTION.UPLOAD_RECEIPT,
                )}
                enctype="multipart/form-data"
                class="upload-form"
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
                  type="file"
                  name="file"
                  required
                  accept="image/*,application/pdf"
                />
                <Button variant="primary" type="submit"
                  >Subir</Button
                >
              </form>
            {/if}
          </li>
        {/each}
      </ul>
    </Content.Section>
  {/each}
</Content.Root>

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
  .download-link {
    color: rgb(59 130 246);
    text-decoration: underline;
  }
  .upload-form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>

<script lang="ts">
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"
  import {
    get_payment_status_label,
    get_payment_status_style,
  } from "$lib/payment_status"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Title>
    {data.status === null
      ? "Estado desconocido"
      : get_payment_status_label(data.status)}
  </Content.Title>
  <Content.Section>
    <p
      class="message {data.status === null
        ? 'status-unknown'
        : get_payment_status_style(data.status)}"
    >
      {data.message}
    </p>
    {#if data.operation_id}
      <p class="operation-id">
        ID de operación: {data.operation_id}
      </p>
    {/if}
    <a href="/pay">
      <Button>Volver</Button>
    </a>
  </Content.Section>
</Content.Root>

<style>
  .message {
    margin-bottom: 1rem;
    font-weight: 500;
  }
  .status-unknown {
    color: rgb(75 85 99);
  }
  .status-approved {
    color: rgb(22 163 74);
  }
  .status-pending {
    color: rgb(202 138 4);
  }
  .status-error {
    color: rgb(220 38 38);
  }
  .operation-id {
    margin-bottom: 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(75 85 99);
  }
</style>

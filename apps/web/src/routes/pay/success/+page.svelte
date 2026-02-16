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
      class="mb-4 font-medium {data.status === null
        ? 'text-gray-600'
        : get_payment_status_style(data.status)}"
    >
      {data.message}
    </p>
    {#if data.operation_id}
      <p class="mb-4 text-sm text-gray-600">
        ID de operación: {data.operation_id}
      </p>
    {/if}
    <a href="/pay">
      <Button>Volver</Button>
    </a>
  </Content.Section>
</Content.Root>

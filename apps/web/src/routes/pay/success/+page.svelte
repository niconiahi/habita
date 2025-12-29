<script lang="ts">
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Title>Pago exitoso</Content.Title>
  <Content.Section>
    <p class="mb-4 text-green-600 font-medium">
      Tu pago ha sido procesado correctamente.
    </p>
    {#if data.payment_id}
      <p class="mb-4 text-sm text-gray-600">
        ID de pago: {data.payment_id}
      </p>
    {/if}
    <a href="/pay">
      <Button>Volver</Button>
    </a>
  </Content.Section>
</Content.Root>

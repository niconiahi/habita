<script lang="ts">
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"
</script>

<Content.Root>
  <Content.Title>Pago fallido</Content.Title>
  <Content.Section>
    <p class="mb-4 text-red-600 font-medium">
      Hubo un problema al procesar tu pago.
    </p>
    <p class="mb-4 text-sm text-gray-600">
      Por favor, intenta nuevamente o contacta soporte si el
      problema persiste.
    </p>
    <a href="/pay">
      <Button>Intentar de nuevo</Button>
    </a>
  </Content.Section>
</Content.Root>

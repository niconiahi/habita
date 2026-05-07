<script lang="ts">
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"
</script>

<Content.Root>
  <Content.Title>Pago fallido</Content.Title>
  <Content.Section>
    <p class="error-message">
      Hubo un problema al procesar tu pago.
    </p>
    <p class="help-text">
      Por favor, intenta nuevamente o contacta soporte si el
      problema persiste.
    </p>
    <a href="/pay">
      <Button>Intentar de nuevo</Button>
    </a>
  </Content.Section>
</Content.Root>

<style>
  .error-message {
    margin-bottom: 1rem;
    color: rgb(220 38 38);
    font-weight: 500;
  }
  .help-text {
    margin-bottom: 1rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(75 85 99);
  }
</style>

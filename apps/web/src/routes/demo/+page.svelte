<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"
  let { form } = $props()
  let is_loading = $state(false)
</script>

<Content.Root>
  <Content.Title>Demo</Content.Title>
  <Content.Section>
    {#if form?.success}
      <p class="message success">
        Te vamos a contactar por email para coordinar una
        demo
      </p>
      <a href="/properties">
        <Button>Volver al inicio</Button>
      </a>
    {:else}
      <p class="message">
        Solicitá una demo para conocer cómo funciona la
        cuenta de Inmobiliaria
      </p>
      <form
        method="POST"
        use:enhance={() => {
          is_loading = true
          return async ({ update }) => {
            is_loading = false
            await update()
          }
        }}
      >
        {#if form?.success === false}
          <p class="error">
            Hubo un error, intentá de nuevo
          </p>
        {/if}
        <Button type="submit" disabled={is_loading}>
          {is_loading
            ? "Enviando..."
            : "Que me contacten por email"}
        </Button>
      </form>
    {/if}
  </Content.Section>
</Content.Root>

<style>
  .message {
    color: var(--gray-300);
    margin-bottom: var(--spacing-4);
  }
  .success {
    color: var(--accent);
  }
  .error {
    color: var(--destructive);
    margin-bottom: var(--spacing-4);
  }
  form {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
</style>

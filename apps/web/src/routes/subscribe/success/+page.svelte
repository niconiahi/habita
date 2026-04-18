<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import * as Content from "$lib/components/Content"
</script>

<Content.Root>
  <Content.Title>Pago confirmado</Content.Title>
  <Content.Section>
    <div class="success-card">
      <p>
        Tu suscripción fue renovada exitosamente. Ya podés
        continuar usando Habita.
      </p>
      <a href="/admin/properties">
        <Button variant="primary">Ir al panel</Button>
      </a>
    </div>
  </Content.Section>
</Content.Root>

<style>
  .success-card {
    padding: var(--dimension-spacing-6);
    border: 2px solid var(--color-green-500);
    background-color: var(--color-absolute-white);
    border-radius: var(--dimension-radius-lg);
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }
</style>

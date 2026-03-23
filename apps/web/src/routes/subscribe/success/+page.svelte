<script lang="ts">
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
      <a class="button" href="/admin/properties">
        Ir al panel
      </a>
    </div>
  </Content.Section>
</Content.Root>

<style>
  .success-card {
    padding: var(--spacing-6);
    border: 2px solid var(--green-500, #22c55e);
    background-color: var(--gray-700);
    border-radius: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    color: var(--gray-100);
  }

  .button {
    display: inline-block;
    padding: var(--spacing-2) var(--spacing-4);
    background-color: var(--accent);
    color: var(--gray-100);
    border-radius: 0.25rem;
    text-decoration: none;
    text-align: center;
    font-weight: 600;
  }
</style>

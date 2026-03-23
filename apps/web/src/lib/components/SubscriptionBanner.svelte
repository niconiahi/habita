<script lang="ts">
  interface Props {
    days_remaining: number
  }

  let { days_remaining }: Props = $props()
</script>

<div class="banner">
  <p>
    Tu suscripción venció. Te quedan
    <strong>{days_remaining}</strong>
    {days_remaining === 1 ? "día" : "días"} para renovar.
    <a href="/subscribe">Renovar ahora</a>
  </p>
</div>

<style>
  .banner {
    position: sticky;
    top: var(--header-height);
    z-index: 9;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--spacing-3) var(--spacing-4);
    background-color: var(--warning-bg, #92400e);
    color: var(--warning-text, #fef3c7);
  }

  .banner p {
    margin: 0;
    font-size: 0.875rem;
  }

  .banner a {
    color: inherit;
    font-weight: 600;
    text-decoration: underline;
  }
</style>

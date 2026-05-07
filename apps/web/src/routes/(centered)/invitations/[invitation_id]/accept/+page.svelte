<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<div class="page">
  {#if data.state === "not_found"}
    <h1 class="heading-md title">Invitación no encontrada</h1>
    <p class="body-md-regular message">
      No pudimos encontrar esta invitación. Pedile a quien
      te invitó que te envíe un nuevo link.
    </p>
  {:else if data.state === "expired"}
    <h1 class="heading-md title">Invitación expirada</h1>
    <p class="body-md-regular message">
      Este link expiró. Pedile a quien te invitó que te
      envíe una nueva invitación.
    </p>
  {:else if data.state === "canceled"}
    <h1 class="heading-md title">Invitación cancelada</h1>
    <p class="body-md-regular message">
      Esta invitación fue cancelada. Si pensás que es un
      error, contactá a quien te invitó.
    </p>
  {:else if data.state === "rejected"}
    <h1 class="heading-md title">Invitación rechazada</h1>
    <p class="body-md-regular message">
      Esta invitación fue rechazada. Si querés volver a
      unirte, pedí una nueva invitación.
    </p>
  {:else if data.state === "mismatch"}
    <h1 class="heading-md title">Email diferente</h1>
    <p class="body-md-regular message">
      Esta invitación es para <strong
        >{data.invited_email}</strong
      >. Iniciá sesión con esa cuenta para aceptarla.
    </p>
    <a href="/login" class="cta">
      <Button variant="primary">Iniciar sesión</Button>
    </a>
  {:else if data.state === "error"}
    <h1 class="heading-md title">Algo salió mal</h1>
    <p class="body-md-regular message">
      No pudimos procesar tu invitación. Intentá de nuevo en
      un rato o pedile a quien te invitó que reenvíe el
      link.
    </p>
  {/if}
</div>

<style>
  .page {
    margin: auto;
    max-width: 32rem;
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
    text-align: center;
  }

  .title {
    color: var(--color-text-heading);
  }

  .message {
    color: var(--color-text-body);
  }

  .cta {
    align-self: center;
    margin-top: var(--dimension-spacing-2);
  }
</style>

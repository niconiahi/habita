<script lang="ts">
  import { page } from "$app/state"
  import { display_date } from "$lib/display_date"

  const date = $derived(page.url.searchParams.get("date"))

  const formatted_date = $derived(
    date
      ? display_date(new Date(date), {
          weekday: "long",
          day: "numeric",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      : "",
  )
</script>

<div class="centered">
  <div class="card">
    <h1 class="heading-md title">Visita reservada</h1>
    <p class="body-md-medium description">
      Tu visita para el día
      <strong class="body-md-bold">{formatted_date}</strong>
      fue reservada. Queda pendiente de aprobación por el administrador.
      Te enviaremos un email con los detalles una vez confirmada
    </p>
    <p class="body-md-medium footer">
      <a href="/properties">Volver a propiedades</a>
    </p>
  </div>
</div>

<style>
  .centered {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .card {
    border: 2px solid var(--card-border);
    border-radius: var(--dimension-radius-2xl);
    padding: var(--dimension-spacing-6);
    width: 443px;
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .title {
    color: var(--color-text-heading);
    margin: 0;
  }

  .description {
    color: var(--color-text-body);
    margin: 0;
  }

  .footer {
    color: var(--color-text-body);
    margin: 0;
  }
</style>

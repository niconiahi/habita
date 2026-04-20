<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import SegmentedButton from "$lib/components/SegmentedButton.svelte"

  const SEGMENT_ITEMS = [
    { label: "Mensual", value: "monthly" },
    { label: "Anual", value: "annual" },
  ]

  let selected = $state("monthly")

  function handle_change(value: string) {
    selected = value
  }
</script>

<div class="page">
  <h1 class="heading-lg title">Precios</h1>

  <div class="toggle">
    <SegmentedButton
      items={SEGMENT_ITEMS}
      {selected}
      onchange={handle_change}
    />
  </div>

  {#if selected === "monthly"}
    <div class="cards">
      <div class="card">
        <h2 class="heading-sm card-title">Freelance</h2>
        <p class="heading-md price">
          $35 USD<span class="body-md-regular period"
            >/mes</span
          >
        </p>
        <ul class="features">
          <li class="body-md-regular">1 usuario</li>
          <li class="body-md-regular">
            Todas las
            <a href="/functionalities"> funcionalidades </a>
          </li>
          <li class="body-md-regular">
            30 días gratis. Se cobra automáticamente al
            finalizar el período de prueba
          </li>
        </ul>
        <a href="/signup">
          <Button variant="primary">Empezar gratis</Button>
        </a>
      </div>

      <div class="card">
        <h2 class="heading-sm card-title">Inmobiliaria</h2>
        <p class="heading-md price">
          $50 USD<span class="body-md-regular period"
            >/puesto/mes</span
          >
        </p>
        <ul class="features">
          <li class="body-md-regular">
            Equipos para organizar administradores por zona,
            sucursal o criterio propio
          </li>
          <li class="body-md-regular">
            Todas las
            <a href="/functionalities"> funcionalidades </a>
          </li>
          <li class="body-md-regular">
            30 días gratis. Se cobra automáticamente al
            finalizar el período de prueba
          </li>
        </ul>
        <a href="/signup">
          <Button variant="primary">Empezar gratis</Button>
        </a>
      </div>
    </div>
  {:else}
    <div class="cards">
      <div class="card">
        <h2 class="heading-sm card-title">Freelance</h2>
        <p class="heading-md price">
          $350 USD<span class="body-md-regular period"
            >/año</span
          > <span class="discount body-sm-bold">-17%</span>
        </p>
        <ul class="features">
          <li class="body-md-regular">1 usuario</li>
          <li class="body-md-regular">
            Todas las
            <a href="/functionalities"> funcionalidades </a>
          </li>
          <li class="body-md-regular">
            30 días gratis. Se cobra automáticamente al
            finalizar el período de prueba
          </li>
        </ul>
        <a href="/signup">
          <Button variant="primary">Empezar gratis</Button>
        </a>
      </div>

      <div class="card">
        <h2 class="heading-sm card-title">Inmobiliaria</h2>
        <p class="heading-md price">
          $500 USD<span class="body-md-regular period"
            >/puesto/año</span
          > <span class="discount body-sm-bold">-17%</span>
        </p>
        <ul class="features">
          <li class="body-md-regular">
            Equipos para organizar administradores por zona,
            sucursal o criterio propio
          </li>
          <li class="body-md-regular">
            Todas las
            <a href="/functionalities"> funcionalidades </a>
          </li>
          <li class="body-md-regular">
            30 días gratis. Se cobra automáticamente al
            finalizar el período de prueba
          </li>
        </ul>
        <a href="/signup">
          <Button variant="primary">Empezar gratis</Button>
        </a>
      </div>
    </div>
  {/if}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--dimension-spacing-8);
    padding-block: var(--dimension-spacing-8);
  }

  .title {
    color: var(--color-text-heading);
  }

  .toggle {
    display: flex;
    justify-content: center;
  }

  .cards {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--dimension-spacing-6);
    width: 100%;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
    padding: var(--dimension-spacing-6);
    border: 1px solid var(--card-border);
    border-radius: var(--dimension-radius-2xl);
    background-color: var(--card-bg-default);
  }

  .card-title {
    color: var(--card-fg-heading);
  }

  .price {
    color: var(--color-text-heading);
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-2);
  }

  .period {
    color: var(--color-text-body);
  }

  .discount {
    padding: var(--dimension-spacing-1)
      var(--dimension-spacing-2);
    background-color: var(--color-green-100);
    color: var(--color-green-700);
    border-radius: var(--dimension-radius-full);
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
    list-style: disc;
    padding-left: var(--dimension-spacing-6);
  }

  .card > a {
    margin-top: auto;
  }

  a :global(button) {
    width: 100%;
  }
</style>

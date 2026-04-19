<script lang="ts">
  import Button from "$lib/components/Button.svelte"
</script>

<div class="page">
  <h1 class="heading-md title">Panel de administración</h1>
  <p class="body-md-medium subtitle">
    Desde acá podés gestionar todo lo relacionado a tus propiedades, contratos e inquilinos.
  </p>

  <section class="card">
    <h2 class="heading-sm card-title">Propiedades</h2>
    <ol class="steps">
      <li class="step">
        <span class="step-number body-md-bold">1</span>
        <p class="body-md-medium">
          Cargá todos los datos de la propiedad: ubicación, fotos, servicios y disposición de ambientes
        </p>
      </li>
      <li class="step">
        <span class="step-number body-md-bold">2</span>
        <p class="body-md-medium">
          Creá el contrato inicial, el cual incluirá el precio inicial de publicación
        </p>
      </li>
      <li class="step">
        <span class="step-number body-md-bold">3</span>
        <p class="body-md-medium">
          Publicá la propiedad y empezá a recibir visitas de candidatos interesados
        </p>
      </li>
      <li class="step">
        <span class="step-number body-md-bold">4</span>
        <p class="body-md-medium">
          Seleccioná a un candidato como inquilino. La publicación de la propiedad pasa a estar inactiva
        </p>
      </li>
      <li class="step">
        <span class="step-number body-md-bold">5</span>
        <p class="body-md-medium">
          Inquilino y dueño firman el contrato y el mismo pasa a estar activo. Comienza el trackeo de pagos
        </p>
      </li>
    </ol>
    <a href="/admin/properties" class="card-action">
      <Button variant="primary">Ir a propiedades</Button>
    </a>
  </section>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-8);
  }

  .title {
    color: var(--color-text-heading);
  }

  .subtitle {
    color: var(--color-text-body);
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
    padding: var(--dimension-spacing-6);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-xl);
  }

  .card-title {
    color: var(--color-text-heading);
  }

  .card-action {
    text-decoration: none;
    width: fit-content;
  }

  .steps {
    display: flex;
    align-items: flex-start;
    gap: var(--dimension-spacing-2);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--dimension-spacing-2);
    flex: 1;
    text-align: center;
    position: relative;
  }

  .step:not(:last-child)::after {
    content: "";
    position: absolute;
    top: var(--dimension-spacing-4);
    left: calc(50% + var(--dimension-spacing-6));
    right: calc(-50% + var(--dimension-spacing-6));
    height: 2px;
    background-color: var(--color-blue-200);
  }

  .step-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--dimension-spacing-8);
    height: var(--dimension-spacing-8);
    border-radius: var(--dimension-radius-full);
    background-color: var(--color-blue-100);
    color: var(--color-blue-700);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  .step p {
    color: var(--color-text-body);
  }
</style>

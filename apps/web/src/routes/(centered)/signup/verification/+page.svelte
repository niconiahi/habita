<div class="centered">
  <div class="card">
    <h1 class="title">Revisá tu email</h1>
    <p class="description">
      Te enviamos un enlace de verificación. Hacé clic en el
      enlace para activar tu cuenta.
    </p>
    <p class="footer">
      ¿Ya verificaste?
      <a class="link" href="/login">Iniciar sesión</a>
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
    font-family: var(--font-family-heading);
    font-size: var(--font-size-heading-md);
    color: var(--color-text-heading);
    margin: 0;
  }

  .description {
    font-family: var(--font-family-body);
    font-size: var(--font-size-body-md);
    color: var(--color-text-body);
    margin: 0;
  }

  .footer {
    display: flex;
    gap: var(--dimension-spacing-2);
    align-items: center;
    font-family: var(--font-family-body);
    font-size: var(--font-size-body-md);
    color: var(--color-text-body);
    margin: 0;
  }
</style>

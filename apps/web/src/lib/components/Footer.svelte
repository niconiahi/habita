<footer>
  <div class="container">
    <div class="group">
      <h3 class="heading-sm title">Producto</h3>
      <ul class="links">
        <li>
          <a href="/pricing">Precios</a>
        </li>
        <li>
          <a href="/functionalities"> Funcionalidades </a>
        </li>
      </ul>
    </div>
    <div class="group">
      <h3 class="heading-sm title">Explorá</h3>
      <ul class="links">
        <li>
          <a href="/properties">Propiedades</a>
        </li>
        <li>
          <a href="/chat">Preguntale a nuestro agente</a>
        </li>
      </ul>
    </div>
    <div class="group">
      <h3 class="heading-sm title">Artículos</h3>
      <ul class="links">
        <li>
          <a href="/learn/booking">
            Reservar visita a una propiedad
          </a>
        </li>
        <li>
          <a href="/learn/phone-number">
            Formato de numero de telefono argentino
          </a>
        </li>
        <li>
          <a href="/learn/user-information">
            Informacion de usuario
          </a>
        </li>
      </ul>
    </div>
    <div class="group">
      <h3 class="heading-sm title">Preguntas frecuentes</h3>
      <ul class="links">
        <li>
          <a href="/faq/alerts">¿Qué alertas provee Habita?</a>
        </li>
        <li>
          <a href="/faq/automated-processes">¿Qué procesos están automatizados?</a>
        </li>
        <li>
          <a href="/faq/contract-data">¿Qué datos se piden para un contrato?</a>
        </li>
        <li>
          <a href="/faq/digital-signature-legality">¿Qué tan legal es la firma digital?</a>
        </li>
        <li>
          <a href="/faq/digital-signature-security">¿Es la firma digital segura?</a>
        </li>
        <li>
          <a href="/faq/google-calendar">¿Puedo integrar las visitas a Google Calendar?</a>
        </li>
        <li>
          <a href="/faq/payment-tracking">¿Cómo funciona el seguimiento de pagos?</a>
        </li>
        <li>
          <a href="/faq/property-data">¿Qué datos incluye una propiedad?</a>
        </li>
        <li>
          <a href="/faq/user-data">¿Qué datos pedimos a cada usuario?</a>
        </li>
      </ul>
    </div>
  </div>
</footer>

<style>
  footer {
    display: flex;
    justify-content: center;
    padding: var(--dimension-spacing-10)
      var(--dimension-spacing-6);
    background-color: var(--color-neutrals-50);
    border-top: 1px solid var(--color-border-primary);
  }

  .container {
    display: flex;
    gap: var(--dimension-spacing-16);
    width: 100%;
    max-width: var(--dimension-screen-lg);
  }

  .group {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .title {
    color: var(--color-text-heading);
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }
</style>

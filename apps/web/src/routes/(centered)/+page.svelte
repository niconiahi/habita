<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import Tooltip from "$lib/components/Tooltip.svelte"
</script>

<div class="page">
  <section class="hero">
    <h1 class="heading-lg slogan">El hogar del inmueble</h1>
    <p class="body-md-regular description">
      Publicá propiedades, agendá visitas, firmá contratos y
      cobrá alquileres — todo desde Habita
    </p>
    <div class="ctas">
      <a href="/signup" class="cta-link">
        <Button variant="primary">Empezar gratis</Button>
      </a>
      <a href="/signup" class="cta-link">
        <Button variant="secondary"
          >Solicitar una demo</Button
        >
      </a>
    </div>
  </section>

  <section class="problem">
    <h2 class="heading-md section-title">
      Hoy usás 4 herramientas desconectadas para gestionar
      un solo alquiler
    </h2>
    <div class="problem-grid">
      <div class="problem-block">
        <div class="problem-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m3 11 18-5v12L3 13v-2z" />
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
          </svg>
        </div>
        <h3 class="body-md-bold">Publicación</h3>
        <p class="body-sm-regular">
          Cargás la misma propiedad en 2 portales distintos
        </p>
      </div>
      <div class="problem-block">
        <div class="problem-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <rect
              width="8"
              height="4"
              x="8"
              y="2"
              rx="1"
              ry="1"
            />
            <path
              d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"
            />
            <path d="M12 11h4" /><path d="M12 16h4" />
            <path d="M8 11h.01" /><path d="M8 16h.01" />
          </svg>
        </div>
        <h3 class="body-md-bold">Gestión</h3>
        <p class="body-sm-regular">
          Saltás entre Tokko y 2clics para cada operación
        </p>
      </div>
      <div class="problem-block">
        <div class="problem-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.54 6a2 2 0 0 1-1.95 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"
            />
          </svg>
        </div>
        <h3 class="body-md-bold">Documentos</h3>
        <p class="body-sm-regular">
          Buscás contratos entre Google Drive y carpetas
          sueltas
        </p>
      </div>
      <div class="problem-block">
        <div class="problem-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22z" />
            <path d="M8 12h.01" /><path
              d="M12 12h.01"
            /><path d="M16 12h.01" />
          </svg>
        </div>
        <h3 class="body-md-bold">Comunicación</h3>
        <p class="body-sm-regular">
          Seguís hilos en WhatsApp, email y no encontrás
          nada
        </p>
      </div>
    </div>
  </section>

  <section class="solution">
    <h2 class="heading-md section-title">
      Habita reemplaza todo eso
    </h2>
    <ol class="steps">
      <li class="step">
        <div class="step-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m3 11 18-5v12L3 13v-2z" />
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
          </svg>
        </div>
        <p class="body-md-regular">
          Publicá una propiedad y que los inquilinos la
          encuentren
        </p>
      </li>
      <li class="step">
        <div class="step-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 2v4" /><path d="M16 2v4" />
            <rect
              width="18"
              height="18"
              x="3"
              y="4"
              rx="2"
            />
            <path d="M3 10h18" />
            <path d="M8 14h.01" /><path
              d="M12 14h.01"
            /><path d="M16 14h.01" />
            <path d="M8 18h.01" /><path
              d="M12 18h.01"
            /><path d="M16 18h.01" />
          </svg>
        </div>
        <p class="body-md-regular">
          Recibí reservas de visitas y evaluá candidatos, de
          sencilla conexión con <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noopener noreferrer">Google Calendar</a
          >
        </p>
      </li>
      <li class="step">
        <div class="step-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path
              d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
            />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 12h4" /><path d="M10 16h4" />
          </svg>
        </div>
        <p class="body-md-regular">
          Generá el contrato de manera totalmente guiada y
          simple. Aún con la profusa cantidad de datos que
          Habita maneja, el proceso es simple e intutivo
        </p>
      </li>
      <li class="step">
        <div class="step-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m12 19 7-7 3 3-7 7-3-3z" />
            <path
              d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"
            />
            <path d="m2 2 7.586 7.586" />
            <circle cx="11" cy="11" r="2" />
          </svg>
        </div>
        <p class="body-md-regular">
          Firmá digitalmente con validez legal, utilizando <a
            href="http://alpha2000.com.ar/v3/firmadigital/"
            target="_blank"
            rel="noopener noreferrer">Alpha2000</a
          >
          (ente
          <a
            href="https://www.argentina.gob.ar/jefatura/innovacion-ciencia-y-tecnologia/innovacion/firma-digital/certificadores-licenciados"
            target="_blank"
            rel="noopener noreferrer">autorizado</a
          >)
        </p>
      </li>
      <li class="step">
        <div class="step-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path
              d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"
            />
            <path d="M12 18V6" />
          </svg>
        </div>
        <p class="body-md-regular">
          Hacé seguimiento y guarda el histórico de pagos
          del alquiler, servicios e impuestos. Alertas tanto
          para administradores como para inquilinos
        </p>
      </li>
    </ol>
  </section>

  <section class="comparison">
    <table>
      <thead>
        <tr>
          <th class="body-sm-bold">Herramienta</th>
          <th class="body-sm-bold">Publicación</th>
          <th class="body-sm-bold">Visitas</th>
          <th class="body-sm-bold">Contratos</th>
          <th class="body-sm-bold">Firma digital</th>
          <th class="body-sm-bold">Pagos</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://www.zonaprop.com.ar"
              target="_blank"
              rel="noopener"
            >
              Zonaprop
            </a>
          </td>
          <td class="body-md-regular">Sí</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
        </tr>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://gestion.argenprop.com"
              target="_blank"
              rel="noopener"
            >
              Argenprop
            </a>
          </td>
          <td class="body-md-regular">Sí</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
        </tr>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://2clics.app"
              target="_blank"
              rel="noopener"
            >
              2clics
            </a>
          </td>
          <td class="body-md-regular">Sí</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
        </tr>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://www.tokkobroker.com/es-ar/"
              target="_blank"
              rel="noopener"
            >
              Tokko Broker
            </a>
          </td>
          <td class="body-md-regular">Sí</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
        </tr>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://www.inmosoft.com.ar"
              target="_blank"
              rel="noopener"
            >
              Inmosoft
            </a>
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">
            <Tooltip
              id="tip-inmosoft"
              content="Administración de contratos. Recibos, liquidaciones, indexación. No redacta contratos"
              >Parcial</Tooltip
            >
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">Sí</td>
        </tr>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://barreeo.com"
              target="_blank"
              rel="noopener"
            >
              Barreeo
            </a>
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">
            <Tooltip
              id="tip-barreeo"
              content="Carga de contratos existentes. Calcula aumentos IPC/ICL y punitorios. No redacta contratos"
              >Parcial</Tooltip
            >
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">Sí</td>
        </tr>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://tusalquileres.com.ar"
              target="_blank"
              rel="noopener"
            >
              Tus Alquileres
            </a>
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">
            <Tooltip
              id="tip-tusalquileres"
              content="Gestión de contratos existentes. Impresión de pagarés. No redacta contratos"
              >Parcial</Tooltip
            >
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">Sí</td>
        </tr>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://www.rentacontrol.com.ar"
              target="_blank"
              rel="noopener"
            >
              RentaControl
            </a>
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">
            <Tooltip
              id="tip-rentacontrol"
              content="Administración de contratos existentes. Liquidaciones y recibos. No redacta contratos"
              >Parcial</Tooltip
            >
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">Sí</td>
        </tr>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://www.ubiquo.com.ar"
              target="_blank"
              rel="noopener"
            >
              Ubiquo
            </a>
          </td>
          <td class="body-md-regular">
            <Tooltip
              id="tip-ubiquo-pub"
              content="Diseña sitio web de la agencia donde se listan propiedades. No es un marketplace con búsqueda y filtros para inquilinos"
              >Parcial</Tooltip
            >
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">
            <Tooltip
              id="tip-ubiquo-con"
              content="Carga de datos precontractuales. Automatiza índices y pagos. No redacta contratos"
              >Parcial</Tooltip
            >
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">Sí</td>
        </tr>
        <tr>
          <td class="body-md-medium">
            <a
              href="https://spot.net.ar"
              target="_blank"
              rel="noopener"
            >
              SPOT
            </a>
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">
            <Tooltip
              id="tip-spot"
              content="Carga de contratos con IA. Extrae datos del PDF. No redacta contratos"
              >Parcial</Tooltip
            >
          </td>
          <td class="body-md-regular">No</td>
          <td class="body-md-regular">Sí</td>
        </tr>
        <tr class="habita-row">
          <td class="body-md-bold">Habita</td>
          <td class="body-md-bold">Sí</td>
          <td class="body-md-bold">Sí</td>
          <td class="body-md-bold">Sí</td>
          <td class="body-md-bold">Sí</td>
          <td class="body-md-bold">Sí</td>
        </tr>
      </tbody>
    </table>
  </section>
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-16);
    padding-block: var(--dimension-spacing-12);
  }

  .section-title {
    color: var(--color-text-heading);
    text-align: center;
  }

  /* hero */

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--dimension-spacing-6);
    text-align: center;
    padding-block: var(--dimension-spacing-12);
  }

  .slogan {
    color: var(--color-text-heading);
  }

  .description {
    max-width: 540px;
  }

  .ctas {
    display: flex;
    gap: var(--dimension-spacing-3);
  }

  /* problem */

  .problem {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-8);
  }

  .problem-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--dimension-spacing-4);
  }

  .problem-block {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-5);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-xl);
  }

  .problem-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--dimension-spacing-10);
    height: var(--dimension-spacing-10);
    border-radius: var(--dimension-radius-lg);
    background-color: var(--color-blue-50);
    color: var(--color-blue-500);
  }

  /* solution */

  .solution {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-8);
  }

  .steps {
    display: flex;
    align-items: flex-start;
    gap: var(--dimension-spacing-2);
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
    top: var(--dimension-spacing-5);
    left: calc(50% + var(--dimension-spacing-7));
    right: calc(-50% + var(--dimension-spacing-7));
    height: 2px;
    background-color: var(--color-blue-200);
  }

  .step-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--dimension-spacing-10);
    height: var(--dimension-spacing-10);
    border-radius: var(--dimension-radius-full);
    background-color: var(--color-blue-50);
    color: var(--color-blue-500);
    flex-shrink: 0;
    position: relative;
    z-index: 1;
  }

  /* comparison */

  .comparison {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th {
    text-align: left;
    padding: var(--dimension-spacing-3);
    border-bottom: 1px solid var(--color-border-primary);
    color: var(--color-text-body);
  }

  td {
    padding: var(--dimension-spacing-3);
    border-bottom: 1px solid var(--color-border-primary);
    color: var(--color-text-body);
  }

  .habita-row {
    background-color: var(--color-blue-50);
  }

  .habita-row td {
    color: var(--color-blue-700);
  }
</style>

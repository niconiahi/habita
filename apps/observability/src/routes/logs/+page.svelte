<script lang="ts">
  let { data } = $props()

  function format_timestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    })
  }

  let expanded_row = $state<number | null>(null)

  function toggle_row(index: number) {
    expanded_row = expanded_row === index ? null : index
  }
</script>

<svelte:head>
  <title>Logs | Observability</title>
</svelte:head>

<div class="page">
  <h1 class="title">Logs</h1>

  <form method="get" class="filters">
    <label class="filter">
      <span class="label">Servicio</span>
      <select name="service">
        <option value="">Todos</option>
        {#each data.services as service_name}
          <option
            value={service_name}
            selected={data.filters.service === service_name}
          >
            {service_name}
          </option>
        {/each}
      </select>
    </label>

    <label class="filter">
      <span class="label">Severidad</span>
      <select name="severity">
        <option value="">Todas</option>
        {#each ["DEBUG", "INFO", "WARN", "ERROR"] as level}
          <option
            value={level}
            selected={data.filters.severity === level}
          >
            {level}
          </option>
        {/each}
      </select>
    </label>

    <label class="filter">
      <span class="label">Rango</span>
      <select name="hours">
        {#each [1, 6, 24, 72] as h}
          <option
            value={h}
            selected={data.filters.hours === h}
          >
            {h}h
          </option>
        {/each}
      </select>
    </label>

    <label class="filter">
      <span class="label">Limite</span>
      <select name="limit">
        {#each [50, 100, 500] as l}
          <option
            value={l}
            selected={data.filters.limit === l}
          >
            {l}
          </option>
        {/each}
      </select>
    </label>

    <button type="submit" class="apply">Aplicar</button>
  </form>

  {#if data.logs.length === 0}
    <p class="empty">
      No se encontraron logs para los filtros seleccionados
    </p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Severidad</th>
            <th>Servicio</th>
            <th>Mensaje</th>
            <th>Trace</th>
          </tr>
        </thead>
        <tbody>
          {#each data.logs as log, index}
            <tr
              class="row"
              class:error-row={log.severity === "ERROR"}
              onclick={() => toggle_row(index)}
            >
              <td class="mono">
                {format_timestamp(log.Timestamp)}
              </td>
              <td>
                <span
                  class="severity"
                  class:severity-error={log.severity === "ERROR"}
                  class:severity-warn={log.severity === "WARN"}
                  class:severity-info={log.severity === "INFO"}
                >
                  {log.severity}
                </span>
              </td>
              <td class="mono">{log.ServiceName}</td>
              <td class="body-cell">
                {#if expanded_row === index}
                  <pre class="body-expanded">{log.Body}</pre>
                {:else}
                  <span class="body-truncated">
                    {log.Body.slice(0, 120)}{log.Body.length > 120 ? "..." : ""}
                  </span>
                {/if}
              </td>
              <td>
                {#if log.TraceId}
                  <a
                    href="/traces/{log.TraceId}"
                    class="trace-link"
                    onclick={(e) => e.stopPropagation()}
                  >
                    {log.TraceId.slice(0, 8)}
                  </a>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 1400px;
    margin: 0 auto;
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 16px;
    color: var(--log);
  }

  .filters {
    display: flex;
    gap: 12px;
    align-items: end;
    margin-bottom: 16px;
  }

  .filter {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .label {
    font-size: 11px;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  select {
    background: var(--bg);
    color: var(--text);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 6px 10px;
    font-size: 13px;
  }

  .apply {
    background: var(--log);
    color: var(--neutral-0);
    border: none;
    border-radius: 6px;
    padding: 6px 16px;
    font-size: 13px;
    cursor: pointer;
  }

  .apply:hover {
    opacity: 0.85;
  }

  .table-wrap {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  th {
    text-align: left;
    padding: 8px 12px;
    border-bottom: 1px solid var(--border);
    color: var(--text-muted);
    font-weight: 500;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  td {
    padding: 6px 12px;
    border-bottom: 1px solid var(--border-subtle);
    vertical-align: top;
  }

  .row {
    cursor: pointer;
  }

  .row:hover {
    background: var(--hover-bg);
  }

  .error-row {
    background: var(--error-subtle);
  }

  .mono {
    font-family: var(--mono);
    font-size: 12px;
    white-space: nowrap;
  }

  .severity {
    font-family: var(--mono);
    font-size: 11px;
    font-weight: 600;
    color: var(--text-muted);
  }

  .severity-info {
    color: var(--log);
  }

  .severity-warn {
    color: var(--warning);
  }

  .severity-error {
    color: var(--error);
  }

  .body-cell {
    max-width: 600px;
  }

  .body-truncated {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--text-secondary);
  }

  .body-expanded {
    font-family: var(--mono);
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
    margin: 0;
    color: var(--text);
  }

  .trace-link {
    font-family: var(--mono);
    font-size: 12px;
    color: var(--trace);
    text-decoration: none;
  }

  .trace-link:hover {
    text-decoration: underline;
  }

  .empty {
    color: var(--text-muted);
    text-align: center;
    padding: 48px 0;
  }
</style>

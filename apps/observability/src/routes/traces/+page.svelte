<script lang="ts">
  let { data } = $props()

  function format_timestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
  }

  function format_duration(
    nanoseconds: string | number,
  ): string {
    const ns = Number(nanoseconds)
    if (ns < 1_000_000) return "< 1ms"
    const ms = ns / 1_000_000
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }
</script>

<svelte:head>
  <title>Traces | Observability</title>
</svelte:head>

<div class="page">
  <h1 class="title">Traces</h1>

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

  {#if data.traces.length === 0}
    <p class="empty">
      No se encontraron traces para los filtros seleccionados
    </p>
  {:else}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Hora</th>
            <th>Root Span</th>
            <th>Servicio</th>
            <th>Duracion</th>
            <th>Spans</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {#each data.traces as trace}
            <tr
              class="row"
              class:error-row={trace.root_status === "STATUS_CODE_ERROR"}
            >
              <td class="mono">
                {format_timestamp(trace.started_at)}
              </td>
              <td>
                <a
                  href="/traces/{trace.TraceId}"
                  class="trace-link"
                >
                  {trace.root_span_name}
                </a>
              </td>
              <td class="mono">{trace.root_service}</td>
              <td class="mono">
                {format_duration(trace.root_duration)}
              </td>
              <td class="mono">{trace.span_count}</td>
              <td>
                {#if trace.root_status === "STATUS_CODE_ERROR"}
                  <span class="status-error">ERROR</span>
                {:else}
                  <span class="status-ok">OK</span>
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
    color: var(--trace);
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
    background: var(--trace);
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

  .trace-link {
    color: var(--trace);
    text-decoration: none;
  }

  .trace-link:hover {
    text-decoration: underline;
  }

  .status-ok {
    color: var(--metric);
    font-size: 11px;
    font-weight: 600;
  }

  .status-error {
    color: var(--error);
    font-size: 11px;
    font-weight: 600;
  }

  .empty {
    color: var(--text-muted);
    text-align: center;
    padding: 48px 0;
  }
</style>

<script lang="ts">
  import { log_caught } from "./forms/log_caught.remote"
  import { log_levels } from "./forms/log_levels.remote"
  import { log_unknown } from "./forms/log_unknown.remote"
  import { nested_spans } from "./forms/nested_spans.remote"
  import { throw_async } from "./forms/throw_async.remote"
  import { throw_sync } from "./forms/throw_sync.remote"

  const LOGS_URL = "https://observability.dev.habita.rent/logs?service=web"

  function trace_link(trace_id: string | undefined): string {
    if (!trace_id) return ""
    return `https://observability.dev.habita.rent/traces/${trace_id}`
  }
</script>

<svelte:head>
  <title>ENG-198 telemetry POC</title>
</svelte:head>

<section class="page">
  <header>
    <h1>ENG-198 telemetry POC</h1>
    <p class="subtitle">
      Click cualquier escenario para emitir logs / traces. Verifica el resultado en
      <a href={LOGS_URL} target="_blank" rel="noreferrer">/logs</a>.
    </p>
  </header>

  <ul class="grid">
    <li class="card">
      <h2>1. Sync throw</h2>
      <p>
        <code>throw new Error</code> sincronico. El stack debe apuntar a
        <code>throw_sync.remote.ts</code>.
      </p>
      <form {...throw_sync.enhance(async ({ submit }) => { await submit() })}>
        <button type="submit">Throw sync</button>
      </form>
      {#if throw_sync.result}
        <p class="result">
          trace: <code>{throw_sync.result.trace_id}</code>
          <a href={trace_link(throw_sync.result.trace_id)} target="_blank" rel="noreferrer">ver traza</a>
        </p>
      {/if}
    </li>

    <li class="card">
      <h2>2. Async throw</h2>
      <p>
        Promise rejection en async chain. Verifica que el parser maneja stacks async.
      </p>
      <form {...throw_async.enhance(async ({ submit }) => { await submit() })}>
        <button type="submit">Throw async</button>
      </form>
      {#if throw_async.result}
        <p class="result">
          trace: <code>{throw_async.result.trace_id}</code>
          <a href={trace_link(throw_async.result.trace_id)} target="_blank" rel="noreferrer">ver traza</a>
        </p>
      {/if}
    </li>

    <li class="card">
      <h2>3. Caught + logged</h2>
      <p>
        <code>logger.error(msg, &#123;user_facing, retried&#125;, err)</code>. Verifica merge de attrs.
      </p>
      <form {...log_caught.enhance(async ({ submit }) => { await submit() })}>
        <button type="submit">Catch + log</button>
      </form>
      {#if log_caught.result}
        <p class="result">
          trace: <code>{log_caught.result.trace_id}</code>
          <a href={trace_link(log_caught.result.trace_id)} target="_blank" rel="noreferrer">ver traza</a>
        </p>
      {/if}
    </li>

    <li class="card">
      <h2>4. Niveles de log</h2>
      <p>Sin error. Verifica severity → label en /logs.</p>
      <div class="row">
        {#each ["info", "warn", "error"] as level}
          <form {...log_levels.enhance(async ({ submit }) => { await submit() })}>
            <input type="hidden" name="level" value={level} />
            <button type="submit">{level}</button>
          </form>
        {/each}
      </div>
      {#if log_levels.result}
        <p class="result">
          trace: <code>{log_levels.result.trace_id}</code>
          <a href={trace_link(log_levels.result.trace_id)} target="_blank" rel="noreferrer">ver traza</a>
        </p>
      {/if}
    </li>

    <li class="card">
      <h2>5. Spans anidados</h2>
      <p>
        Outer + inner span manuales. Logs internos deben heredar el mismo
        <code>trace_id</code>.
      </p>
      <form {...nested_spans.enhance(async ({ submit }) => { await submit() })}>
        <button type="submit">Crear spans</button>
      </form>
      {#if nested_spans.result}
        <p class="result">
          trace: <code>{nested_spans.result.trace_id}</code>
          <a href={trace_link(nested_spans.result.trace_id)} target="_blank" rel="noreferrer">ver traza</a>
        </p>
      {/if}
    </li>

    <li class="card">
      <h2>6. logger.unknown(value)</h2>
      <p>
        Throw de un valor que no es <code>Error</code>. Verifica el path sintetico.
      </p>
      <form {...log_unknown.enhance(async ({ submit }) => { await submit() })}>
        <button type="submit">Throw string</button>
      </form>
      {#if log_unknown.result}
        <p class="result">
          trace: <code>{log_unknown.result.trace_id}</code>
          <a href={trace_link(log_unknown.result.trace_id)} target="_blank" rel="noreferrer">ver traza</a>
        </p>
      {/if}
    </li>
  </ul>
</section>

<style>
  .page {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px;
  }

  h1 {
    font-size: 22px;
    margin: 0 0 8px;
  }

  .subtitle {
    color: var(--color-text-secondary, #555);
    margin: 0 0 24px;
  }

  .grid {
    list-style: none;
    padding: 0;
    margin: 0;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
  }

  .card {
    border: 1px solid var(--color-border, #ddd);
    border-radius: 8px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card h2 {
    font-size: 15px;
    margin: 0;
  }

  .card p {
    font-size: 13px;
    margin: 0;
    color: var(--color-text-secondary, #555);
  }

  .row {
    display: flex;
    gap: 8px;
  }

  button {
    padding: 6px 12px;
    border-radius: 6px;
    border: 1px solid var(--color-border, #ccc);
    background: #fff;
    cursor: pointer;
    font-size: 13px;
  }

  button:hover {
    background: #f5f5f5;
  }

  code {
    font-family: var(--font-mono, ui-monospace, monospace);
    font-size: 12px;
    background: #f0f0f0;
    padding: 1px 4px;
    border-radius: 3px;
  }

  .result {
    margin-top: 8px;
    font-size: 12px;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
</style>

<script lang="ts">
  type Span = {
    Timestamp: string
    TraceId: string
    SpanId: string
    ParentSpanId: string
    SpanName: string
    SpanKind: string
    ServiceName: string
    Duration: string | number
    StatusCode: string
    StatusMessage: string
    SpanAttributes: Record<string, string>
  }

  type SpanNode = {
    span: Span
    children: SpanNode[]
  }

  type FlatSpan = {
    span: Span
    depth: number
  }

  let { data } = $props()

  const SERVICE_COLORS = [
    "#58a6ff",
    "#3fb950",
    "#d29922",
    "#f778ba",
    "#a371f7",
    "#79c0ff",
    "#56d364",
    "#e3b341",
  ]

  function get_service_color(
    service: string,
    services: string[],
  ): string {
    const index = services.indexOf(service)
    return SERVICE_COLORS[index % SERVICE_COLORS.length]
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

  function format_timestamp(timestamp: string): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    })
  }

  function build_span_tree(spans: Span[]): SpanNode[] {
    const nodes_by_id = new Map<string, SpanNode>()
    for (const span of spans) {
      nodes_by_id.set(span.SpanId, { span, children: [] })
    }
    const roots: SpanNode[] = []
    for (const node of nodes_by_id.values()) {
      const parent_id = node.span.ParentSpanId
      const parent = parent_id
        ? nodes_by_id.get(parent_id)
        : undefined
      if (parent) {
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    }
    return roots
  }

  function flatten_tree(roots: SpanNode[]): FlatSpan[] {
    const result: FlatSpan[] = []
    function walk(nodes: SpanNode[], depth: number) {
      for (const node of nodes) {
        result.push({ span: node.span, depth })
        walk(node.children, depth + 1)
      }
    }
    walk(roots, 0)
    return result
  }

  const roots = $derived(build_span_tree(data.spans))
  const flat_spans = $derived(flatten_tree(roots))

  const unique_services = $derived([
    ...new Set(data.spans.map((s) => s.ServiceName)),
  ])

  const trace_start = $derived(
    Math.min(
      ...data.spans.map((s) =>
        new Date(s.Timestamp).getTime(),
      ),
    ),
  )
  const trace_end = $derived(
    Math.max(
      ...data.spans.map(
        (s) =>
          new Date(s.Timestamp).getTime() +
          Number(s.Duration) / 1_000_000,
      ),
    ),
  )
  const trace_duration = $derived(trace_end - trace_start)

  let selected_span = $state<Span | null>(null)
</script>

<svelte:head>
  <title>
    Trace {data.trace_id.slice(0, 8)} | Observability
  </title>
</svelte:head>

<div class="page">
  <div class="header">
    <a href="/traces" class="back-link">← Traces</a>
    <h1 class="title">
      Trace
      <span class="trace-id">
        {data.trace_id.slice(0, 16)}...
      </span>
    </h1>
    <div class="meta">
      <span>{data.spans.length} spans</span>
      <span>{format_duration(trace_duration * 1_000_000)}</span>
      <span>{format_timestamp(data.spans[0].Timestamp)}</span>
    </div>
  </div>

  <div class="legend">
    {#each unique_services as service}
      <span class="legend-item">
        <span
          class="legend-dot"
          style="background: {get_service_color(service, unique_services)}"
        ></span>
        {service}
      </span>
    {/each}
  </div>

  <div class="waterfall-container">
    <div class="waterfall">
      {#each flat_spans as { span, depth }}
        {@const span_start =
          new Date(span.Timestamp).getTime() - trace_start}
        {@const span_duration =
          Number(span.Duration) / 1_000_000}
        {@const left_percent =
          trace_duration > 0
            ? (span_start / trace_duration) * 100
            : 0}
        {@const width_percent =
          trace_duration > 0
            ? Math.max(
                (span_duration / trace_duration) * 100,
                0.3,
              )
            : 100}
        <button
          class="span-row"
          class:selected={selected_span?.SpanId ===
            span.SpanId}
          class:error-span={span.StatusCode ===
            "STATUS_CODE_ERROR"}
          onclick={() =>
            (selected_span =
              selected_span?.SpanId === span.SpanId
                ? null
                : span)}
        >
          <div
            class="span-label"
            style="padding-left: {depth * 16 + 8}px"
          >
            <span class="span-name">{span.SpanName}</span>
            <span class="span-duration">
              {format_duration(span.Duration)}
            </span>
          </div>
          <div class="span-bar-container">
            <div
              class="span-bar"
              style="left: {left_percent}%; width: {width_percent}%; background: {get_service_color(span.ServiceName, unique_services)}"
            ></div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  {#if selected_span}
    <div class="detail-panel">
      <div class="detail-header">
        <h2 class="detail-title">
          {selected_span.SpanName}
        </h2>
        <button
          class="close-button"
          onclick={() => (selected_span = null)}
        >
          ×
        </button>
      </div>
      <dl class="detail-list">
        <dt>Servicio</dt>
        <dd>{selected_span.ServiceName}</dd>
        <dt>Tipo</dt>
        <dd>{selected_span.SpanKind}</dd>
        <dt>Estado</dt>
        <dd
          class:error-text={selected_span.StatusCode ===
            "STATUS_CODE_ERROR"}
        >
          {selected_span.StatusCode}
        </dd>
        {#if selected_span.StatusMessage}
          <dt>Mensaje</dt>
          <dd class="error-text">
            {selected_span.StatusMessage}
          </dd>
        {/if}
        <dt>Duracion</dt>
        <dd>
          {format_duration(selected_span.Duration)}
        </dd>
        <dt>Span ID</dt>
        <dd class="mono">{selected_span.SpanId}</dd>
        {#if selected_span.ParentSpanId}
          <dt>Parent ID</dt>
          <dd class="mono">
            {selected_span.ParentSpanId}
          </dd>
        {/if}
      </dl>
      {#if Object.keys(selected_span.SpanAttributes).length > 0}
        <h3 class="attributes-title">Atributos</h3>
        <dl class="detail-list">
          {#each Object.entries(selected_span.SpanAttributes) as [key, value]}
            <dt>{key}</dt>
            <dd class="mono">{value}</dd>
          {/each}
        </dl>
      {/if}
    </div>
  {/if}
</div>

<style>
  .page {
    max-width: 1400px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 16px;
  }

  .back-link {
    color: var(--link, #58a6ff);
    text-decoration: none;
    font-size: 13px;
  }

  .back-link:hover {
    text-decoration: underline;
  }

  .title {
    font-size: 20px;
    font-weight: 600;
    margin: 8px 0 4px;
  }

  .trace-id {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 16px;
    color: var(--text-muted, #8b949e);
  }

  .meta {
    display: flex;
    gap: 16px;
    font-size: 13px;
    color: var(--text-muted, #8b949e);
  }

  .legend {
    display: flex;
    gap: 16px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: var(--text-muted, #8b949e);
  }

  .legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .waterfall-container {
    border: 1px solid var(--border, #30363d);
    border-radius: 8px;
    overflow: hidden;
  }

  .waterfall {
    display: flex;
    flex-direction: column;
  }

  .span-row {
    display: grid;
    grid-template-columns: 300px 1fr;
    align-items: center;
    border: none;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
    border-bottom: 1px solid
      var(--border-subtle, #21262d);
    padding: 0;
    min-height: 28px;
    font: inherit;
    width: 100%;
  }

  .span-row:hover {
    background: var(--hover-bg, #161b22);
  }

  .span-row.selected {
    background: var(--active-bg, #1c2128);
  }

  .span-row.error-span {
    background: rgba(248, 81, 73, 0.05);
  }

  .span-label {
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    padding-right: 8px;
  }

  .span-name {
    font-size: 12px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .span-duration {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 11px;
    color: var(--text-muted, #8b949e);
    white-space: nowrap;
    flex-shrink: 0;
  }

  .span-bar-container {
    position: relative;
    height: 16px;
    margin: 0 8px;
  }

  .span-bar {
    position: absolute;
    height: 100%;
    border-radius: 3px;
    min-width: 2px;
    opacity: 0.8;
  }

  .detail-panel {
    margin-top: 16px;
    border: 1px solid var(--border, #30363d);
    border-radius: 8px;
    padding: 16px;
    background: var(--nav-bg, #161b22);
  }

  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .detail-title {
    font-size: 16px;
    font-weight: 600;
    margin: 0;
  }

  .close-button {
    background: none;
    border: none;
    color: var(--text-muted, #8b949e);
    font-size: 20px;
    cursor: pointer;
    padding: 4px 8px;
  }

  .close-button:hover {
    color: var(--text, #e1e4e8);
  }

  .detail-list {
    display: grid;
    grid-template-columns: 120px 1fr;
    gap: 4px 12px;
    font-size: 13px;
    margin: 0;
  }

  dt {
    color: var(--text-muted, #8b949e);
    font-weight: 500;
  }

  dd {
    margin: 0;
    word-break: break-all;
  }

  .attributes-title {
    font-size: 14px;
    font-weight: 600;
    margin: 16px 0 8px;
  }

  .mono {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 12px;
  }

  .error-text {
    color: var(--red, #f85149);
  }
</style>

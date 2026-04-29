<script lang="ts">
  import { page } from "$app/state"

  let { data, children } = $props()

  const MAIN_APP_URL =
    typeof window !== "undefined"
      ? window.location.origin.replace("observability.", "")
      : ""
</script>

<div class="shell">
  <nav class="nav">
    <div class="nav-left">
      <span class="nav-title">Observability</span>
      <a
        href="/logs"
        class="nav-link"
        class:active={page.url.pathname === "/logs"}
      >
        Logs
      </a>
      <a
        href="/traces"
        class="nav-link"
        class:active={page.url.pathname.startsWith("/traces")}
      >
        Traces
      </a>
    </div>
    <div class="nav-right">
      {#if data.user}
        <span class="user-email">{data.user.email}</span>
      {/if}
      <a href={MAIN_APP_URL} class="nav-link">
        Volver a Habita
      </a>
    </div>
  </nav>
  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--bg, #0f1117);
    color: var(--text, #e1e4e8);
  }

  .shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    height: 48px;
    background: var(--nav-bg, #161b22);
    border-bottom: 1px solid var(--border, #30363d);
  }

  .nav-left,
  .nav-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .nav-title {
    font-weight: 600;
    font-size: 14px;
    margin-right: 8px;
  }

  .nav-link {
    font-size: 13px;
    color: var(--text-muted, #8b949e);
    text-decoration: none;
    padding: 4px 8px;
    border-radius: 6px;
  }

  .nav-link:hover {
    color: var(--text, #e1e4e8);
    background: var(--hover-bg, #21262d);
  }

  .nav-link.active {
    color: var(--text, #e1e4e8);
    background: var(--active-bg, #30363d);
  }

  .user-email {
    font-size: 12px;
    color: var(--text-muted, #8b949e);
  }

  .content {
    flex: 1;
    padding: 24px;
  }
</style>

<script lang="ts">
  import { page } from "$app/state"
  import "../tokens.css"

  let { data, children } = $props()
</script>

<div class="shell">
  <nav class="nav">
    <span class="title">observability</span>
    <div class="links">
      <a
        href="/logs"
        class="link"
        class:active-log={page.url.pathname === "/logs"}
      >
        logs
      </a>
      <a
        href="/traces"
        class="link"
        class:active-trace={page.url.pathname.startsWith("/traces")}
      >
        traces
      </a>
    </div>
    {#if data.user}
      <span class="user">{data.user.email}</span>
    {/if}
  </nav>
  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: system-ui, -apple-system, sans-serif;
    background: var(--bg);
    color: var(--text);
  }

  .shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 0 24px;
    height: 48px;
    background: var(--nav-bg);
    color: var(--nav-text);
  }

  .title {
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.02em;
  }

  .links {
    display: flex;
    gap: 4px;
    margin-left: auto;
  }

  .link {
    font-size: 13px;
    color: var(--nav-text-muted);
    text-decoration: none;
    padding: 4px 10px;
    border-radius: 6px;
    border-bottom: 2px solid transparent;
  }

  .link:hover {
    color: var(--nav-text);
  }

  .active-log {
    color: var(--log);
    border-color: var(--log);
  }

  .active-trace {
    color: var(--trace);
    border-color: var(--trace);
  }

  .user {
    font-size: 12px;
    color: var(--nav-text-muted);
  }

  .content {
    flex: 1;
    padding: 24px;
  }
</style>

<script lang="ts">
  import * as Dashboard from "$lib/components/Dashboard"
  import Footer from "$lib/components/Footer.svelte"
  import Header from "$lib/components/Header.svelte"
  import { fetch_articles } from "./learn/[slug]/fetchers"
  import type { LayoutData } from "./$types"

  let {
    children,
    data,
  }: {
    children: import("svelte").Snippet
    data: LayoutData
  } = $props()

  const articles = fetch_articles()
</script>

<Header is_manager={data.is_manager} />
<div class="container">
  <aside>
    <nav aria-label="Aprende">
      <ul>
        {#each articles as article (article.slug)}
          <Dashboard.Link href="/learn/{article.slug}">
            {article.title}
          </Dashboard.Link>
        {/each}
      </ul>
    </nav>
  </aside>
  <main>
    {@render children()}
  </main>
</div>
<Footer />

<style>
  .container {
    display: grid;
    grid-template-columns: 280px 1fr;
    gap: var(--dimension-spacing-8);
    padding: var(--dimension-spacing-8)
      var(--dimension-spacing-6);
    background-color: var(--color-absolute-white);
  }

  aside {
    position: sticky;
    top: calc(
      var(--header-height) + var(--dimension-spacing-8)
    );
    height: fit-content;
  }

  aside ul {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
  }

  main {
    min-width: 0;
  }
</style>

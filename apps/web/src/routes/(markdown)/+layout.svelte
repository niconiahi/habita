<script lang="ts">
  import * as AssistantWidget from "$lib/components/AssistantWidget"
  import * as Dashboard from "$lib/components/Dashboard"
  import Footer from "$lib/components/Footer.svelte"
  import Header from "$lib/components/Header.svelte"
  import { fetch_articles as fetch_learn_articles } from "./learn/[slug]/fetchers"
  import { fetch_articles as fetch_faq_articles } from "./faq/[slug]/fetchers"
  import type { LayoutData } from "./$types"

  let {
    children,
    data,
  }: {
    children: import("svelte").Snippet
    data: LayoutData
  } = $props()

  const learn_articles = fetch_learn_articles()
  const faq_articles = fetch_faq_articles()
</script>

<Header is_manager={data.is_manager} user={data.user} />
<div class="container">
  <aside>
    <nav aria-label="Contenido">
      <section class="section">
        <span class="body-sm-bold section-label"
          >Aprendé</span
        >
        <ul class="link-list">
          {#each learn_articles as article (article.slug)}
            <Dashboard.Link href="/learn/{article.slug}">
              {article.title}
            </Dashboard.Link>
          {/each}
        </ul>
      </section>
      <section class="section">
        <span class="body-sm-bold section-label"
          >Preguntas frecuentes</span
        >
        <ul class="link-list">
          {#each faq_articles as article (article.slug)}
            <Dashboard.Link href="/faq/{article.slug}">
              {article.title}
            </Dashboard.Link>
          {/each}
        </ul>
      </section>
    </nav>
  </aside>
  <main>
    {@render children()}
  </main>
</div>
<AssistantWidget.Root
  is_authenticated={data.user !== null}
/>
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
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
  }

  nav {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-8);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .section-label {
    color: var(--color-text-heading);
    padding: 0 var(--dimension-spacing-2);
  }

  .link-list {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
    list-style: none;
    padding: 0;
    margin: 0;
  }

  main {
    min-width: 0;
  }
</style>

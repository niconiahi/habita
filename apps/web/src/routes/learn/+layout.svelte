<script lang="ts">
  import * as Dashboard from "$lib/components/Dashboard"
  import { fetch_articles } from "./[slug]/fetchers"
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()

  const articles = fetch_articles()
</script>

<div class="learn-layout">
  <Dashboard.Root label="Aprende">
    <Dashboard.Section>
      {#each articles as article (article.slug)}
        <Dashboard.Link href="/learn/{article.slug}">
          {article.title}
        </Dashboard.Link>
      {/each}
    </Dashboard.Section>
  </Dashboard.Root>
  {@render children()}
</div>

<style>
  .learn-layout {
    display: flex;
  }
</style>

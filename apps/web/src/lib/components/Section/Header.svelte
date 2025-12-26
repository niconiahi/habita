<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()
</script>

<header class="section">
  {@render children()}
</header>

<style>
  .section {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    position: sticky;
    top: var(--header-height);
    background-color: var(--gray-900);
    z-index: 5;
    padding-inline: 0;
    padding-block: var(--spacing-4);
    height: auto;
    width: calc(100% + var(--spacing-8));
    margin-left: calc(var(--spacing-4) * -1);
  }

  .section:has(:global(.actions)) {
    justify-content: space-between;
  }

  .section :global(h3) {
    margin-left: var(--spacing-4);
    font-size: var(--spacing-8);
  }

  .section :global(h3)::first-letter {
    text-transform: uppercase;
  }
</style>

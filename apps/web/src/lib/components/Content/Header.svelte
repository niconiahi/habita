<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()
</script>

<header class="content-header">
  {@render children()}
</header>

<style>
  .content-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    position: sticky;
    top: var(--header-height);
    z-index: 10;
    padding-block: var(--spacing-4);
    margin-top: calc(var(--spacing-4) * -1);
  }

  .content-header:has(:global(.actions)) {
    justify-content: space-between;
  }
</style>

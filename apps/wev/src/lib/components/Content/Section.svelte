<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
  }

  let { children }: Props = $props();
</script>

<section>
  {@render children()}
</section>

<style>
  section :global(ul) {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    width: 100%;
  }

  section :global(li) {
    width: 100%;
  }

  section :global(article) {
    min-height: 120px;
  }
</style>

<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    label?: string;
  }

  let { children, label }: Props = $props();
</script>

<main aria-label={label}>
  {@render children()}
</main>

<style>
  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--spacing-4);
    gap: var(--spacing-12);
  }
</style>

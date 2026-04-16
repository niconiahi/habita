<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
    label?: string
  }

  let { children, label }: Props = $props()
</script>

<main aria-label={label}>
  {@render children()}
</main>

<style>
  main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }
</style>

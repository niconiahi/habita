<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    children: Snippet;
    label: string;
  }

  let { children, label }: Props = $props();
</script>

<nav class="dashboard" aria-label={label}>
  {@render children()}
</nav>

<style>
  .dashboard {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: var(--spacing-4);
    min-width: 12rem;
    height: calc(100vh - var(--header-height));
    background-color: var(--gray-700);
    position: sticky;
    top: var(--header-height);
    align-self: flex-start;
  }
</style>

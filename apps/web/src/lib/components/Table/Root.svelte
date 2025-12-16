<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<table class="table">
  {@render children()}
</table>

<style>
  .table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
    border: 1px solid var(--gray-400);
  }

  .table :global(thead tr) {
    background-color: var(--gray-700);
  }

  .table :global(th) {
    border: 1px solid var(--gray-400);
    padding: var(--spacing-3);
    font-weight: 500;
  }

  .table :global(td) {
    border: 1px solid var(--gray-400);
    padding: var(--spacing-3);
  }
</style>

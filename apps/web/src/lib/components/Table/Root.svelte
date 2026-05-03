<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()
</script>

<table class="table">
  {@render children()}
</table>

<style>
  .table {
    width: 100%;
    border-collapse: collapse;
    text-align: left;
  }

  .table :global(th) {
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-3);
    color: var(--color-text-body);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .table :global(td) {
    padding: var(--dimension-spacing-3);
    color: var(--color-text-body);
    border-bottom: 1px solid var(--color-border-primary);
  }
</style>

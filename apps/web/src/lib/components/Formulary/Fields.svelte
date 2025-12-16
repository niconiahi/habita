<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<div class="fields">
  {@render children()}
</div>

<style>
  .fields {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
</style>

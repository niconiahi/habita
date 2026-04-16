<script lang="ts">
  import type { Snippet } from "svelte"

  let { children }: { children: Snippet } = $props()
</script>

<div class="field">
  {@render children()}
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .field :global(.error) {
    color: var(--destructive);
    font-size: var(--font-size-body-sm);
  }
</style>

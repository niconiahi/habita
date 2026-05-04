<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="actions">
  {@render children()}
</div>

<style>
  .actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--dimension-spacing-2);
  }
</style>

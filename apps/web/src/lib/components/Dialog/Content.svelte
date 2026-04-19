<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="content">
  {@render children()}
</div>

<style>
  .content {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
    padding: var(--dimension-spacing-6);
    background-color: var(--color-absolute-white);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-xl);
    max-height: 80vh;
    overflow-y: auto;
  }
</style>

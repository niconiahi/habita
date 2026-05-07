<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    children: Snippet
  }

  let { children }: Props = $props()
</script>

<div class="icon">
  {@render children()}
</div>

<style>
  .icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--dimension-spacing-10);
    height: var(--dimension-spacing-10);
    border-radius: var(--dimension-radius-lg);
    background-color: var(--color-blue-50);
    color: var(--color-blue-500);
  }
</style>

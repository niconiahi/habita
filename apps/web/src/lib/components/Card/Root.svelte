<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLAttributes } from "svelte/elements"

  interface Props extends HTMLAttributes<HTMLElement> {
    children: Snippet
  }

  let { children, ...rest }: Props = $props()
</script>

<article class="card" {...rest}>
  {@render children()}
</article>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-5);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-xl);
    background-color: var(--color-absolute-white);
  }
</style>

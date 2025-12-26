<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLAttributes } from "svelte/elements"

  interface Props extends HTMLAttributes<HTMLHeadingElement> {
    children: Snippet
  }

  let { children, ...rest }: Props = $props()
</script>

<h4 {...rest}>
  {@render children()}
</h4>

<style>
  h4 {
    grid-column: 1;
    grid-row: 1;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--gray-100);
  }
</style>

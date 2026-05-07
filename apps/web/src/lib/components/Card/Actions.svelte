<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLAttributes } from "svelte/elements"

  interface Props extends HTMLAttributes<HTMLUListElement> {
    children: Snippet
  }

  let { children, ...rest }: Props = $props()
</script>

<ul
  role="group"
  aria-label="card actions"
  class="actions"
  {...rest}
>
  {@render children()}
</ul>

<style>
  .actions {
    display: flex;
    gap: var(--dimension-spacing-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>

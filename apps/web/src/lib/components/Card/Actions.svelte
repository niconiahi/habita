<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLAttributes } from "svelte/elements"

  interface Props extends HTMLAttributes<HTMLUListElement> {
    children: Snippet
  }

  let {
    children,
    class: className,
    ...rest
  }: Props = $props()
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
    grid-column: 2;
    grid-row: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }
</style>

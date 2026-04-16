<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    id: string
    position?: "bottom" | "right" | "top"
    children: Snippet
  }

  let { id, position = "bottom", children }: Props =
    $props()
</script>

<div
  {id}
  popover="auto"
  class="content {position}"
  style:position-anchor={`--${id}`}
>
  {@render children()}
</div>

<style>
  .content {
    margin: 0;
    padding: var(--dimension-spacing-2);
    background-color: var(--color-absolute-white);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
  }

  .content.bottom {
    position-area: bottom span-left;
    margin-top: var(--dimension-spacing-1);
  }

  .content.right {
    position-area: right span-top;
    margin-left: var(--dimension-spacing-1);
  }

  .content.top {
    position-area: top span-right;
    margin-bottom: var(--dimension-spacing-1);
  }

  .content::backdrop {
    background: transparent;
  }
</style>

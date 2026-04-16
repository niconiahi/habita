<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    id: string
    children: Snippet
  }

  let { id, children }: Props = $props()
</script>

<button
  type="button"
  class="trigger"
  popovertarget={id}
  style:anchor-name={`--${id}`}
>
  {@render children()}
</button>

<style>
  .trigger {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-2);
    width: 100%;
    background-color: var(--popover-bg-default);
    border: none;
    border-radius: var(--dimension-radius-lg);
    color: var(--popover-fg-default);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .trigger:hover {
    background-color: var(--popover-bg-hover);
  }
</style>

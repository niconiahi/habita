<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    active: boolean
    onclick: () => void
    children: Snippet
  }

  let { active, onclick, children }: Props = $props()
</script>

<button
  class="togglable"
  class:active
  type="button"
  {onclick}
>
  {@render children()}
</button>

<style>
  .togglable {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: var(--dimension-spacing-4);
    width: 100%;
    border: 2px solid var(--toggle-border);
    border-radius: var(--dimension-radius-lg);
    background-color: var(--toggle-bg-inactive);
    cursor: pointer;
    text-align: left;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .togglable:hover {
    border-color: var(--color-blue-500);
  }

  .togglable.active {
    background-color: var(--toggle-bg-active);
    border-color: var(--color-blue-500);
  }
</style>

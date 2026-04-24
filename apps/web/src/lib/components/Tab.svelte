<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    active: boolean
    children: Snippet
  }

  let { active, children }: Props = $props()
</script>

<div class="body-md-medium tab" class:active>
  {@render children()}
</div>

<style>
  .tab {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--dimension-spacing-0-5)
      var(--dimension-spacing-3);
    border-bottom: 2px solid var(--tab-border-inactive);
    border-radius: var(--dimension-radius-default)
      var(--dimension-radius-default) 0 0;
    color: var(--color-text-body);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      border-color 0.15s ease;
  }

  .tab :global(a),
  .tab :global(button) {
    all: unset;
    cursor: pointer;
  }

  .tab:hover {
    background-color: var(--color-neutrals-150);
  }

  .tab.active {
    color: var(--color-text-heading);
    border-bottom-color: var(--tab-border-active);
  }
</style>

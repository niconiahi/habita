<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    id: string
    content: string
    children: Snippet
  }

  let { id, content, children }: Props = $props()
</script>

<span class="trigger" aria-describedby={id} tabindex="0">
  {@render children()}
  <span {id} role="tooltip" class="tooltip body-sm-regular">
    {content}
  </span>
</span>

<style>
  .trigger {
    position: relative;
    text-decoration: underline dotted;
    cursor: help;
  }

  .tooltip {
    display: none;
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    translate: -50% 0;
    width: max-content;
    max-width: 240px;
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-3);
    background-color: var(--color-neutrals-950);
    color: var(--color-absolute-white);
    border-radius: var(--dimension-radius-lg);
    z-index: 50;

    &::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      translate: -50% 0;
      border: 6px solid transparent;
      border-top-color: var(--color-neutrals-950);
    }
  }

  .trigger:hover .tooltip,
  .trigger:focus-within .tooltip {
    display: block;
  }
</style>

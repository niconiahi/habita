<script lang="ts">
  import type { Snippet } from "svelte"
  import type { HTMLButtonAttributes } from "svelte/elements"

  interface Props extends HTMLButtonAttributes {
    children: Snippet
    variant?: "primary" | "secondary" | "tertiary"
  }

  let {
    children,
    variant,
    class: className,
    ...rest
  }: Props = $props()

  const class_name = $derived(
    `body-md-bold ${variant ?? ""} ${className ?? ""}`.trim(),
  )
</script>

<button class={class_name} {...rest}>
  {@render children()}
</button>

<style>
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--button-gap);
    white-space: nowrap;
    border-radius: var(--button-radius);
    height: var(--dimension-spacing-10);
    padding: var(--button-padding-y) var(--dimension-spacing-3-5);
    cursor: pointer;
    border: none;
    width: fit-content;
    transition: background-color 0.15s ease;
  }

  button:hover {
    cursor: pointer;
  }

  button:focus-visible {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  button:disabled {
    cursor: not-allowed;
  }

  .primary {
    background-color: var(--button-primary-bg-default);
    color: var(--button-primary-fg-default);
  }

  .primary:hover {
    background-color: var(--button-primary-bg-hover);
    color: var(--button-primary-fg-hover);
  }

  .primary:disabled {
    background-color: var(--button-primary-bg-disabled);
    color: var(--button-primary-fg-disabled);
  }

  .secondary {
    background-color: var(--button-secondary-bg-default);
    color: var(--button-secondary-fg-default);
  }

  .secondary:hover {
    background-color: var(--button-secondary-bg-hover);
    color: var(--button-secondary-fg-hover);
  }

  .secondary:disabled {
    background-color: var(--button-secondary-bg-disabled);
    color: var(--button-secondary-fg-disabled);
  }

  .tertiary {
    background-color: var(--button-tertiary-bg-default);
    color: var(--button-tertiary-fg-default);
  }

  .tertiary:hover {
    background-color: var(--button-tertiary-bg-hover);
    color: var(--button-tertiary-fg-hover);
  }

  .tertiary:disabled {
    background-color: var(--button-tertiary-bg-disabled);
    color: var(--button-tertiary-fg-disabled);
  }
</style>

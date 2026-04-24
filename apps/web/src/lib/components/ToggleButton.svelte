<script lang="ts">
  interface Props {
    label: string
    active: boolean
    onclick?: () => void
  }

  let { label, active, onclick }: Props = $props()
</script>

<button
  class="toggle-button body-md-bold"
  class:active
  type="button"
  {onclick}
>
  {label}
</button>

<style>
  .toggle-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: var(--dimension-spacing-10);
    padding: var(--button-padding-y)
      var(--dimension-spacing-2);
    border-radius: var(--button-radius);
    border: none;
    cursor: pointer;
    white-space: nowrap;
    background-color: var(--button-tertiary-bg-default);
    color: var(--button-tertiary-fg-default);
    transition: background-color 0.15s ease;
  }

  .toggle-button:hover {
    background-color: var(--button-tertiary-bg-hover);
    color: var(--button-tertiary-fg-hover);
  }

  .toggle-button.active {
    background-color: var(--button-secondary-bg-default);
    color: var(--button-secondary-fg-default);
  }

  .toggle-button.active:hover {
    background-color: var(--button-secondary-bg-hover);
    color: var(--button-secondary-fg-hover);
  }

  .toggle-button:focus-visible {
    outline: var(--focus-ring-width) solid
      var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }
</style>

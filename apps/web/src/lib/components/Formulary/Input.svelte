<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements"

  interface Props extends HTMLInputAttributes {
    label: string
    error?: string
  }

  let { label, error, ...rest }: Props = $props()
</script>

<div class="field">
  <label class="body-md-medium label" for={rest.id ?? rest.name}>
    {label}
  </label>
  <input
    class="body-md-medium input"
    id={rest.id ?? rest.name}
    {...rest}
  />
  <p class="body-md-medium error" class:visible={!!error}>
    {error ?? "\u00A0"}
  </p>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
  }

  .label {
    color: var(--color-text-heading);
  }

  div.field > input.input {
    background-color: var(--color-neutrals-50);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
    padding: var(--dimension-spacing-2-5)
      var(--dimension-spacing-3-5);
    color: var(--color-text-heading);
    height: auto;
  }

  div.field > input.input::placeholder {
    color: var(--color-neutrals-300);
  }

  div.field > input.input:focus-visible {
    outline: var(--focus-ring-width) solid
      var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  .error {
    color: transparent;
    margin: 0;
  }

  .error.visible {
    color: var(--color-text-error);
  }
</style>

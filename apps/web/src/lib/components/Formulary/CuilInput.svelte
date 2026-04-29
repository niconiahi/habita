<script lang="ts">
  const CUIL_LENGTH = 11

  interface Props {
    name: string
    value?: string
    error?: string
    label?: string
  }

  let {
    name,
    value = "",
    error,
    label = "CUIL",
  }: Props = $props()

  // svelte-ignore state_referenced_locally
  let digits = $state(value.replace(/\D/g, ""))

  function handle_input(event: Event) {
    const target = event.currentTarget as HTMLInputElement
    digits = target.value.slice(0, CUIL_LENGTH)
  }

  function handle_beforeinput(event: InputEvent) {
    if (
      digits.length >= CUIL_LENGTH &&
      (event.inputType === "insertText" ||
        event.inputType === "insertFromPaste")
    ) {
      event.preventDefault()
    }
  }
</script>

<div class="field">
  <label class="body-md-medium label" for={name}>
    {label}
  </label>
  <input
    id={name}
    class="body-md-medium input"
    type="number"
    oninput={handle_input}
    onbeforeinput={handle_beforeinput}
    placeholder="20123456780"
  />
  <p class="body-md-medium error" class:visible={!!error}>
    {error ?? "\u00A0"}
  </p>
  <input type="hidden" {name} value={digits} />
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

  .input {
    background-color: var(--color-neutrals-50);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
    padding: var(--dimension-spacing-2-5)
      var(--dimension-spacing-3-5);
    color: var(--color-text-heading);
    height: auto;
  }

  .input::placeholder {
    color: var(--color-neutrals-300);
  }

  .input:focus-visible {
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

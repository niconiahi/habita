<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"

  type TypeOption = {
    value: string | number
    label: string
  }

  type Props = {
    types: TypeOption[]
    label: string
    action: string
    name?: string
    type_name?: string
    accept?: string
    data?: Record<string, string | number>
  }

  let {
    types,
    label,
    action,
    name = "file",
    type_name = "type",
    accept,
    data = {},
  }: Props = $props()

  let dialog_el: HTMLDialogElement | undefined = $state()
  let selected_type: string = $state("")
  let error_message: string | null = $state(null)
  let file_input: HTMLInputElement | undefined = $state()
  let form_el: HTMLFormElement | undefined = $state()

  const id = crypto.randomUUID()
  const select_id = `${id}_select`
  const error_id = `${id}_error`

  function open_dialog() {
    dialog_el?.showModal()
  }

  function close_dialog() {
    dialog_el?.close()
    error_message = null
    selected_type = ""
  }

  function handle_backdrop_click(event: MouseEvent) {
    if (event.target === dialog_el) {
      close_dialog()
    }
  }

  function handle_search_click() {
    error_message = null
    if (selected_type === "") {
      error_message = "Selecciona un tipo de documento"
      return
    }
    file_input?.click()
  }

  function handle_file_change() {
    form_el?.requestSubmit()
    close_dialog()
    selected_type = ""
  }
</script>

<div class="root">
  <Button type="button" onclick={open_dialog}>
    {label}
  </Button>
  <dialog
    bind:this={dialog_el}
    class="dialog"
    onclick={handle_backdrop_click}
  >
    <div class="content">
      <button
        type="button"
        class="close-button"
        onclick={close_dialog}
        aria-label="Cerrar"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
      <Formulary.Field>
        <Formulary.Label for={select_id}
          >Tipo</Formulary.Label
        >
        <Formulary.Select
          id={select_id}
          aria-describedby={error_message
            ? error_id
            : undefined}
          aria-invalid={error_message ? "true" : undefined}
          bind:value={selected_type}
          onchange={() => (error_message = null)}
        >
          <option value="">Selecciona un tipo</option>
          {#each types as type_option (type_option.value)}
            <option value={type_option.value}
              >{type_option.label}</option
            >
          {/each}
        </Formulary.Select>
        {#if error_message}
          <span id={error_id} role="alert">
            <Formulary.Error
              >{error_message}</Formulary.Error
            >
          </span>
        {/if}
      </Formulary.Field>
      <Button type="button" onclick={handle_search_click}>
        Buscar archivo
      </Button>
    </div>
  </dialog>
  <form
    bind:this={form_el}
    method="POST"
    {action}
    enctype="multipart/form-data"
    use:enhance
  >
    {#each Object.entries(data) as [field_name, field_value] (field_name)}
      <input
        type="hidden"
        name={field_name}
        value={field_value}
      />
    {/each}
    <input
      type="hidden"
      name={type_name}
      value={selected_type}
    />
    <input
      bind:this={file_input}
      type="file"
      {name}
      {accept}
      class="sr-only"
      onchange={handle_file_change}
    />
  </form>
</div>

<style>
  .root {
    display: inline-block;
  }

  dialog {
    position: fixed;
    inset: 0;
    margin: auto;
    width: fit-content;
    height: fit-content;
    max-width: calc(100vw - 2rem);
    max-height: calc(100vh - 2rem);
    padding: 0;
    border: none;
    background: transparent;
  }

  dialog::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  .content {
    position: relative;
    min-width: 20rem;
    padding: var(--spacing-6);
    background-color: var(--gray-700);
    border: 1px solid var(--gray-400);
    border-radius: var(--spacing-2);
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    color: var(--gray-50);
  }

  .close-button {
    position: absolute;
    top: var(--spacing-2);
    right: var(--spacing-2);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 1.5rem;
    height: 1.5rem;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--gray-300);
    cursor: pointer;
    transition: color 0.15s ease;
  }

  .close-button:hover {
    color: var(--gray-100);
  }
</style>

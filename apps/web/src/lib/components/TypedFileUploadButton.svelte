<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Dialog from "$lib/components/Dialog"
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

  let dialog_element: HTMLDialogElement | undefined =
    $state()
  let selected_type: string = $state("")
  let error_message: string | null = $state(null)
  let file_input: HTMLInputElement | undefined = $state()
  let form_element: HTMLFormElement | undefined = $state()

  const id = crypto.randomUUID()
  const select_id = `${id}_select`
  const error_id = `${id}_error`

  function handle_search_click() {
    error_message = null
    if (selected_type === "") {
      error_message = "Selecciona un tipo de documento"
      return
    }
    file_input?.click()
  }

  function handle_file_change() {
    form_element?.requestSubmit()
    dialog_element?.close()
    selected_type = ""
  }
</script>

<div class="root">
  <Button
    variant="secondary"
    type="button"
    onclick={() => dialog_element?.showModal()}
  >
    {label}
  </Button>
  <Dialog.Root bind:element={dialog_element}>
    {#snippet children({ close })}
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Tipo de documento</Dialog.Title>
          <Dialog.Close
            onclick={() => {
              close()
              error_message = null
              selected_type = ""
            }}
          />
        </Dialog.Header>
        <Formulary.Field>
          <Formulary.Label for={select_id}
            >Tipo</Formulary.Label
          >
          <Formulary.Select
            id={select_id}
            aria-describedby={error_message
              ? error_id
              : undefined}
            aria-invalid={error_message
              ? "true"
              : undefined}
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
        <Button
          variant="primary"
          type="button"
          onclick={handle_search_click}
        >
          Buscar archivo
        </Button>
      </Dialog.Content>
    {/snippet}
  </Dialog.Root>
  <form
    bind:this={form_element}
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

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>

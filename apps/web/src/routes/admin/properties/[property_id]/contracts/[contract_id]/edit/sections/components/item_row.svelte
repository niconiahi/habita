<script lang="ts">
  import Button from "$lib/components/Button.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import {
    CONTRACT_ITEM_STATE,
    get_contract_item_state_label,
  } from "$lib/contract_item_state"
  import { create_contract_item_file } from "../forms/create_contract_item_file.remote"
  import { destroy_contract_item } from "../forms/destroy_contract_item.remote"
  import { destroy_contract_item_file } from "../forms/destroy_contract_item_file.remote"
  import { update_contract_item } from "../forms/update_contract_item.remote"
  import type { PageData } from "../$types"

  type ContractItem =
    PageData["contract"]["contract_items"][number]

  let {
    contract_item,
    contract_id,
    property_id,
  }: {
    contract_item: ContractItem
    contract_id: number
    property_id: number
  } = $props()

  let file_input: HTMLInputElement | undefined = $state()
  let file_form: HTMLFormElement | undefined = $state()

  const update_form = $derived(
    update_contract_item.for(contract_item.id),
  )
  const destroy_form = $derived(
    destroy_contract_item.for(contract_item.id),
  )
  const create_file_form = $derived(
    create_contract_item_file.for(contract_item.id),
  )

  function handle_file_click() {
    file_input?.click()
  }

  function handle_file_change() {
    file_form?.requestSubmit()
  }
</script>

<li class="item-card">
  <form {...update_form}>
    <input type="hidden" name="id" value={contract_item.id} />
    <input
      type="hidden"
      name="contract_id"
      value={contract_id}
    />
    <input
      type="hidden"
      name="property_id"
      value={property_id}
    />
    <div class="form-fields">
      <div class="form-field">
        <label for={`name_${contract_item.id}`}>nombre</label>
        <input
          id={`name_${contract_item.id}`}
          type="text"
          name="name"
          value={contract_item.name}
        />
        {#each update_form.fields.name.issues() as issue}
          <span class="form-error">{issue.message}</span>
        {/each}
      </div>
      <div class="form-field">
        <label for={`state_${contract_item.id}`}
          >estado</label
        >
        <select
          name="state"
          id={`state_${contract_item.id}`}
          value={contract_item.state}
        >
          {#each Object.values(CONTRACT_ITEM_STATE) as state}
            <option value={state}
              >{get_contract_item_state_label(state)}</option
            >
          {/each}
        </select>
      </div>
    </div>
    <div class="form-actions">
      <Formulary.Submission form={update_form}>
        {#snippet children({ is_busy, is_done })}
          <Button
            variant="primary"
            type="submit"
            disabled={is_busy()}
          >
            <Formulary.SubmissionLabel
              is_busy={is_busy()}
              is_done={is_done()}
              idle="Guardar item"
              busy="Guardando item..."
              done="Guardado"
            />
          </Button>
        {/snippet}
      </Formulary.Submission>
    </div>
  </form>
  <form {...destroy_form}>
    <input type="hidden" name="id" value={contract_item.id} />
    <input
      type="hidden"
      name="contract_id"
      value={contract_id}
    />
    <input
      type="hidden"
      name="property_id"
      value={property_id}
    />
    <Formulary.Submission form={destroy_form}>
      {#snippet children({ is_busy, is_done })}
        <Button
          variant="secondary"
          type="submit"
          disabled={is_busy()}
        >
          <Formulary.SubmissionLabel
            is_busy={is_busy()}
            is_done={is_done()}
            idle="Eliminar item"
            busy="Eliminando item..."
            done="Eliminado"
          />
        </Button>
      {/snippet}
    </Formulary.Submission>
  </form>
  <div class="photos-section">
    <div class="photos-header">
      <span class="photos-label">Fotos</span>
      <Button
        variant="secondary"
        type="button"
        onclick={handle_file_click}>Agregar foto</Button
      >
    </div>
    <ul class="photos-grid">
      {#each contract_item.files as file (`contract_item_file_${file.id}`)}
        {@const destroy_file_form =
          destroy_contract_item_file.for(file.id)}
        <li class="photo-item">
          <img
            class="photo"
            alt="Foto del item"
            src={`/files/${file.id}`}
          />
          <form {...destroy_file_form} class="photo-delete">
            <input type="hidden" value={file.id} name="id" />
            <input
              type="hidden"
              value={contract_item.id}
              name="contract_item_id"
            />
            <input
              type="hidden"
              value={contract_id}
              name="contract_id"
            />
            <input
              type="hidden"
              value={property_id}
              name="property_id"
            />
            <Formulary.Submission form={destroy_file_form}>
              {#snippet children({ is_busy })}
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={is_busy()}>X</Button
                >
              {/snippet}
            </Formulary.Submission>
          </form>
        </li>
      {/each}
    </ul>
    <form
      bind:this={file_form}
      {...create_file_form}
      enctype="multipart/form-data"
      class="hidden-form"
    >
      <input
        type="hidden"
        value={contract_item.id}
        name="contract_item_id"
      />
      <input
        type="hidden"
        value={contract_id}
        name="contract_id"
      />
      <input
        type="hidden"
        value={property_id}
        name="property_id"
      />
      <input
        bind:this={file_input}
        type="file"
        name="file"
        accept="image/*"
        class="sr-only"
        onchange={handle_file_change}
      />
    </form>
  </div>
</li>

<style>
  .item-card {
    border: 1px solid rgb(55 65 81);
    padding: 1rem;
    border-radius: 0.25rem;
  }
  .photos-section {
    margin-top: 1rem;
  }
  .photos-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .photos-label {
    font-size: 0.875rem;
    line-height: 1.25rem;
    color: rgb(156 163 175);
  }
  .photos-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }
  .photo-item {
    position: relative;
  }
  .photo {
    width: 24rem;
    aspect-ratio: 16 / 9;
    object-fit: cover;
    display: block;
    border-radius: 0.25rem;
  }
  .photo-delete {
    position: absolute;
    top: 0.25rem;
    left: 0.25rem;
    background-color: rgb(209 213 219);
  }
  .hidden-form {
    display: contents;
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

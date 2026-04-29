<script lang="ts">
  import { enhance } from "$app/forms"
  import * as v from "valibot"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import Button from "$lib/components/Button.svelte"
  import {
    ContractFileTypeSchema,
    get_contract_file_type_label,
  } from "$lib/contract_file_type"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "../actions/action"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()

  let errors = $derived(
    (form?.errors as any)?.create_pdf ?? {},
  )
</script>

<Content.Section>
  <Section.Header>
    <Section.Title>documentos</Section.Title>
  </Section.Header>
  {#if errors.property_road || errors.property_house_number || errors.property_state || errors.property_unit}
    <div class="error-block">
      <p class="error-block-title">Errores de propiedad:</p>
      {#if errors.property_road}
        <span class="error block"
          >{errors.property_road}</span
        >
      {/if}
      {#if errors.property_house_number}
        <span class="error block"
          >{errors.property_house_number}</span
        >
      {/if}
      {#if errors.property_state}
        <span class="error block"
          >{errors.property_state}</span
        >
      {/if}
      {#if errors.property_unit}
        <span class="error block"
          >{errors.property_unit}</span
        >
      {/if}
    </div>
  {/if}
  <ul class="file-list">
    {#each data.contract.files as file (file.id)}
      {@const contract_type = v.parse(
        ContractFileTypeSchema,
        file.type,
      )}
      <li class="file-item">
        <span class="file-type body-sm-bold"
          >{get_contract_file_type_label(
            contract_type,
          )}</span
        >
        <a
          target="_blank"
          href="/files/{file.id}"
          class="file-link">{file.basename}</a
        >
        <form
          method="POST"
          action={compose_action(ACTION.DESTROY_FILE)}
          use:enhance
        >
          <input type="hidden" value={file.id} name="id" />
          <input
            type="hidden"
            value={data.contract.id}
            name="contract_id"
          />
          <Button variant="secondary" type="submit"
            >Eliminar</Button
          >
        </form>
      </li>
    {/each}
    {#each data.tenant_insurance_files as file (file.id)}
      <li class="file-item">
        <span class="file-type body-sm-bold">Seguro</span>
        <a
          target="_blank"
          href="/files/{file.id}"
          class="file-link">{file.basename}</a
        >
      </li>
    {/each}
  </ul>
</Content.Section>

<style>
  .error {
    color: rgb(239 68 68);
  }

  .block {
    display: block;
  }

  .error-block {
    margin-bottom: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .error-block-title {
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: rgb(239 68 68);
  }

  .file-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .file-item {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .file-type {
    font-weight: 700;
  }

  .file-link {
    color: rgb(59 130 246);
    text-decoration: underline;
  }
</style>

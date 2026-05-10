<script lang="ts">
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import TypedFileUploadButton from "$lib/components/TypedFileUploadButton.svelte"
  import {
    get_user_file_type_label,
    USER_FILE_TYPE,
  } from "$lib/user_file_type"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()

  let input_errors = $derived(form?.errors?.nested ?? {})

  let execution_error = $derived(form?.message)

  const document_types = Object.values(USER_FILE_TYPE).map(
    (type) => ({
      value: type,
      label: get_user_file_type_label(type),
    }),
  )
</script>

{#snippet PersonalInfo()}
  <section class="section">
    <h2 class="heading-md title">Información personal</h2>
    {#key data.user_profile}
      <Formulary.Root
        method="POST"
        action={compose_action(ACTION.UPDATE_USER)}
      >
        {#snippet children({ submit_state })}
          <div class="fields">
            <Formulary.Input
              label="Nombre"
              name="name"
              type="text"
              value={data.user_profile.name}
              required
              error={input_errors.name?.[0]}
            />
            <Formulary.Input
              label="Apellido"
              name="surname"
              type="text"
              value={data.user_profile.surname}
              required
              error={input_errors.surname?.[0]}
            />
            <Formulary.PhoneInput
              name="phone_number"
              value={data.user_profile.phone_number ?? ""}
              error={input_errors.phone_number?.[0]}
            />
            <Formulary.Input
              label="Número de documento"
              name="document_number"
              type="number"
              value={data.user_profile.document_number ??
                ""}
              error={input_errors.document_number?.[0]}
            />
            <Formulary.CuilInput
              name="cuil"
              value={data.user_profile.cuil ?? ""}
              error={input_errors.cuil?.[0]}
            />
            {#if execution_error}
              <Formulary.Error
                >{execution_error}</Formulary.Error
              >
            {/if}
            <Button
              variant="primary"
              type="submit"
              disabled={submit_state === "busy"}
            >
              <Formulary.SubmitLabel
                state={submit_state}
                idle="Guardar información"
                busy="Guardando información..."
              done="Guardado"
              />
            </Button>
          </div>
        {/snippet}
      </Formulary.Root>
    {/key}
  </section>
{/snippet}

{#snippet Documents()}
  <section class="section" id="files">
    <div class="section-header">
      <h2 class="heading-md title">Documentos</h2>
      <TypedFileUploadButton
        types={document_types}
        label="Agregar documento"
        action={compose_action(ACTION.CREATE_FILE)}
      />
    </div>
    {#if data.user_files.length > 0}
      <table class="documents-table">
        <thead>
          <tr>
            <th class="body-sm-bold">Documento</th>
            <th class="body-sm-bold">Tipo</th>
            <th class="body-sm-bold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each data.user_files as file (file.id)}
            <tr>
              <td class="body-md-medium">{file.basename}</td
              >
              <td class="body-md-medium">
                {get_user_file_type_label(file.type)}
              </td>
              <td>
                <a
                  class="body-md-medium link"
                  href={`/files/${file.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Descargar
                </a>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <p class="body-md-medium empty">
        No hay documentos cargados
      </p>
    {/if}
  </section>
{/snippet}

<div class="page">
  {@render PersonalInfo()}
  {@render Documents()}
</div>

<style>
  .page {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-10);
    padding-top: var(--dimension-spacing-10);
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .title {
    color: var(--color-text-heading);
  }

  .fields {
    display: flex;
    flex-direction: column;
    max-width: 464px;
  }

  .fields :global(button[type="submit"]) {
    width: 100%;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .documents-table {
    width: 100%;
    border-collapse: collapse;
  }

  .documents-table th {
    text-align: left;
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-3);
    color: var(--color-text-body);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .documents-table td {
    padding: var(--dimension-spacing-3)
      var(--dimension-spacing-3);
    color: var(--color-text-body);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .link {
    color: var(--color-blue-500);
  }

  .empty {
    color: var(--color-text-body);
  }
</style>

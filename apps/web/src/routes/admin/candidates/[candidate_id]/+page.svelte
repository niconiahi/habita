<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import { display_name } from "$lib/display_name"
  import { get_user_file_type_label } from "$lib/user_file_type"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Title
    >{display_name(data.candidate)}</Content.Title
  >
  <Content.Section>
    <Section.Header>
      <Section.Title>Información personal</Section.Title>
    </Section.Header>
    <div class="info-group">
      <div class="info-block">
        <p class="body-sm-bold info-label">Nombre</p>
        <p class="body-md-medium">{data.candidate.name}</p>
      </div>
      <div class="info-block">
        <p class="body-sm-bold info-label">Apellido</p>
        <p class="body-md-medium">
          {data.candidate.surname}
        </p>
      </div>
      {#if data.candidate.phone_number}
        <div class="info-block">
          <p class="body-sm-bold info-label">Teléfono</p>
          <p class="body-md-medium">
            {data.candidate.phone_number}
          </p>
        </div>
      {/if}
      {#if data.candidate.document_number}
        <div class="info-block">
          <p class="body-sm-bold info-label">
            Número de documento
          </p>
          <p class="body-md-medium">
            {data.candidate.document_number}
          </p>
        </div>
      {/if}
      {#if data.candidate.cuil}
        <div class="info-block">
          <p class="body-sm-bold info-label">CUIL</p>
          <p class="body-md-medium">
            {data.candidate.cuil}
          </p>
        </div>
      {/if}
      <div class="info-block">
        <p class="body-sm-bold info-label">Email</p>
        <p class="body-md-medium">
          {data.candidate.email}
        </p>
      </div>
    </div>
  </Content.Section>
  <Content.Section>
    <Section.Header>
      <Section.Title>Documentos</Section.Title>
    </Section.Header>
    {#if data.candidate_files.length > 0}
      <table class="documents-table">
        <thead>
          <tr>
            <th class="body-sm-bold">Documento</th>
            <th class="body-sm-bold">Tipo</th>
            <th class="body-sm-bold">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {#each data.candidate_files as file (file.id)}
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
  </Content.Section>
</Content.Root>

<style>
  .info-group {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .info-block {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
  }

  .info-label {
    color: var(--color-text-body);
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

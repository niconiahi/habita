<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import { ACCESS_TYPE } from "$lib/access_type"
  import {
    SIGNATURE_STATUS,
    get_signature_status_label,
  } from "$lib/signature_status"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
  function get_my_status(
    doc: (typeof data.documents)[number],
  ) {
    return doc.access_type === ACCESS_TYPE.LANDLORD
      ? doc.landlord_status
      : doc.tenant_status
  }
  function get_my_url(
    doc: (typeof data.documents)[number],
  ) {
    return doc.access_type === ACCESS_TYPE.LANDLORD
      ? doc.landlord_url
      : doc.tenant_url
  }
</script>

{#snippet Documents()}
  <Content.Section>
    <Section.Header>
      <Section.Title>documentos para firmar</Section.Title>
    </Section.Header>
    {#if data.documents.length === 0}
      <p>No hay documentos pendientes de firma.</p>
    {:else}
      <table>
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Dirección</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          {#each data.documents as doc (doc.contract_id)}
            {@const my_status = get_my_status(doc)}
            {@const my_url = get_my_url(doc)}
            <tr>
              <td>#{doc.contract_id}</td>
              <td
                >{doc.road}
                {doc.house_number}{doc.city
                  ? `, ${doc.city}`
                  : ""}</td
              >
              <td
                >{get_signature_status_label(
                  my_status ?? "pending",
                )}</td
              >
              <td>
                {#if my_status === SIGNATURE_STATUS.PENDING && my_url}
                  <a
                    href={my_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Firmar
                  </a>
                {:else if my_status === SIGNATURE_STATUS.SIGNED}
                  Firmado
                {:else}
                  —
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {/if}
  </Content.Section>
{/snippet}

<Content.Root>
  <Content.Title>Mis firmas</Content.Title>
  {@render Documents()}
</Content.Root>

<style>
  table {
    width: 100%;
  }
  th {
    text-align: left;
  }
</style>

<script lang="ts">
  import * as Content from "$lib/components/Content";
  import * as Table from "$lib/components/Table";
  import Button from "$lib/components/Button.svelte";
  import { display_date } from "$lib/display_date";
  import { display_location } from "$lib/display_location";
  import { display_name } from "$lib/display_name";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<Content.Root>
  <Content.Title>Candidatos</Content.Title>
  <Content.Section>
    <Table.Root>
      <Table.Header>
        <Table.Cell header>Nombre</Table.Cell>
        <Table.Cell header>Fecha</Table.Cell>
        <Table.Cell header>Propiedad</Table.Cell>
        <Table.Cell header>Acciones</Table.Cell>
      </Table.Header>
      <Table.Body>
        {#each data.candidates as candidate (`${candidate.id}-${candidate.property_id}`)}
          <Table.Row>
            <Table.Cell>{display_name(candidate)}</Table.Cell>
            <Table.Cell>{display_date(candidate.start_date)}</Table.Cell>
            <Table.Cell>{display_location(candidate.location)}</Table.Cell>
            <Table.Cell>
              <a href={`/admin/candidates/${candidate.id}`}>
                <Button>Ver perfil</Button>
              </a>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Content.Section>
</Content.Root>

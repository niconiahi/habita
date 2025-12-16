<script lang="ts">
  import * as Content from "$lib/components/Content";
  import * as Table from "$lib/components/Table";
  import Button from "$lib/components/Button.svelte";
  import { display_location } from "$lib/display_location";
  import { display_name } from "$lib/display_name";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<Content.Root>
  <Content.Title>Inquilinos</Content.Title>
  <Content.Section>
    <Table.Root>
      <Table.Header>
        <Table.Cell header>Nombre</Table.Cell>
        <Table.Cell header>Email</Table.Cell>
        <Table.Cell header>Propiedad</Table.Cell>
        <Table.Cell header>Acciones</Table.Cell>
      </Table.Header>
      <Table.Body>
        {#each data.tenants as tenant (`${tenant.id}-${tenant.property_id}`)}
          <Table.Row>
            <Table.Cell>{display_name(tenant)}</Table.Cell>
            <Table.Cell>{tenant.email}</Table.Cell>
            <Table.Cell>{display_location(tenant.location)}</Table.Cell>
            <Table.Cell>
              <a href={`/admin/tenants/${tenant.id}`}>
                <Button>Ver perfil</Button>
              </a>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Content.Section>
</Content.Root>

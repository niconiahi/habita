<script lang="ts">
  import * as Content from "$lib/components/Content";
  import * as Section from "$lib/components/Section";
  import * as Table from "$lib/components/Table";
  import Button from "$lib/components/Button.svelte";
  import { display_location } from "$lib/display_location";
  import { get_property_type_label } from "$lib/property_type";
  import { get_property_state_label } from "$lib/property_state";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
</script>

<Content.Root>
  <Content.Title>Propiedades</Content.Title>
  <Content.Section>
    <Section.Header>
      <Section.Title>Propiedades</Section.Title>
      <Section.Actions>
        <a href="/admin/properties/new">
          <Button>Nueva propiedad</Button>
        </a>
      </Section.Actions>
    </Section.Header>
    <Table.Root>
      <Table.Header>
        <Table.Cell header>Ubicación</Table.Cell>
        <Table.Cell header>Tipo</Table.Cell>
        <Table.Cell header>Estado</Table.Cell>
        <Table.Cell header>Acciones</Table.Cell>
      </Table.Header>
      <Table.Body>
        {#each data.properties as property (property.id)}
          <Table.Row>
            <Table.Cell>{display_location(property.location)}</Table.Cell>
            <Table.Cell>
              {get_property_type_label(property.type)}
              {property.unit ? ` - ${property.unit}` : ""}
            </Table.Cell>
            <Table.Cell>{get_property_state_label(property.state)}</Table.Cell>
            <Table.Cell>
              <a href={`/admin/properties/${property.id}/edit`}>
                <Button>Editar</Button>
              </a>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Content.Section>
</Content.Root>

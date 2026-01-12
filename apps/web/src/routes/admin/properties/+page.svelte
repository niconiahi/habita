<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Table from "$lib/components/Table"
  import Button from "$lib/components/Button.svelte"
  import { display_location } from "$lib/display_location"
  import { get_property_type_label } from "$lib/property_type"
  import {
    get_property_state_label,
    PROPERTY_STATE,
  } from "$lib/property_state"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
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
            <Table.Cell
              >{display_location(
                property.location,
              )}</Table.Cell
            >
            <Table.Cell>
              {get_property_type_label(property.type)}
              {property.unit ? ` - ${property.unit}` : ""}
            </Table.Cell>
            <Table.Cell
              >{get_property_state_label(
                property.state,
              )}</Table.Cell
            >
            <Table.Cell>
              {#if property.state === PROPERTY_STATE.EDITING}
                <a
                  href={`/admin/properties/${property.id}/edit`}
                >
                  <Button>Editar</Button>
                </a>
                <form
                  method="POST"
                  action={`?/${ACTION.PUBLISH_PROPERTY}`}
                  style="display: inline;"
                  use:enhance
                >
                  <input
                    type="hidden"
                    name="property_id"
                    value={property.id}
                  />
                  <Button type="submit">Publicar</Button>
                </form>
              {/if}
              {#if property.state === PROPERTY_STATE.PUBLISHED}
                <form
                  method="POST"
                  action={`?/${ACTION.UNPUBLISH_PROPERTY}`}
                  style="display: inline;"
                  use:enhance
                >
                  <input
                    type="hidden"
                    name="property_id"
                    value={property.id}
                  />
                  <Button type="submit">Despublicar</Button>
                </form>
              {/if}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Content.Section>
</Content.Root>

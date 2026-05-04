<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Content from "$lib/components/Content"
  import * as Table from "$lib/components/Table"
  import Button from "$lib/components/Button.svelte"
  import { display_date } from "$lib/display_date"
  import { display_location } from "$lib/display_location"
  import { display_name } from "$lib/display_name"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
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
            <Table.Cell
              >{display_name(candidate)}</Table.Cell
            >
            <Table.Cell>
              {display_date(candidate.start_date)} - {display_date(
                candidate.end_date,
                {
                  day: undefined,
                  month: undefined,
                },
              )}
            </Table.Cell>
            <Table.Cell>
              <a
                href={`/admin/properties/${candidate.property_id}/edit/characteristics`}
              >
                {display_location(candidate.location)}
              </a>
            </Table.Cell>
            <Table.Cell>
              <div class="actions">
                <a
                  href={`/admin/candidates/${candidate.id}`}
                >
                  <Button>Ver perfil</Button>
                </a>
                <form
                  method="POST"
                  action={compose_action(ACTION.SET_TENANT)}
                  use:enhance
                >
                  <input
                    type="hidden"
                    name="candidate_id"
                    value={candidate.id}
                  />
                  <input
                    type="hidden"
                    name="property_id"
                    value={candidate.property_id}
                  />
                  <Button variant="primary" type="submit"
                    >Asignar como inquilino</Button
                  >
                </form>
              </div>
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  </Content.Section>
</Content.Root>

<style>
  .actions {
    display: flex;
    gap: 0.5rem;
  }
</style>

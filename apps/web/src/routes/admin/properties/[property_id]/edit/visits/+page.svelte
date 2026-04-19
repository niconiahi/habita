<script lang="ts">
  import * as Table from "$lib/components/Table"
  import { display_name } from "$lib/display_name"
  import { display_date } from "$lib/display_date"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<section>
  <h2 class="heading-sm tab-title">Visitas</h2>
  {#if data.visits.length > 0}
    <Table.Root>
      <Table.Header>
        <Table.Cell header>Visitante</Table.Cell>
        <Table.Cell header>Fecha</Table.Cell>
      </Table.Header>
      <Table.Body>
        {#each data.visits as visit (visit.id)}
          <Table.Row>
            <Table.Cell>
              {display_name(visit)}
            </Table.Cell>
            <Table.Cell>
              {display_date(visit.start_date)}
            </Table.Cell>
          </Table.Row>
        {/each}
      </Table.Body>
    </Table.Root>
  {:else}
    <p class="body-md-medium empty">No hay visitas agendadas</p>
  {/if}
</section>

<style>
  .tab-title {
    color: var(--color-text-heading);
  }

  .empty {
    color: var(--color-text-body);
  }
</style>

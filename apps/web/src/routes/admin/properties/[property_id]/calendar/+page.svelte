<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Table from "$lib/components/Table"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import { get_slot_state_label, SLOT_STATE } from "$lib/slot_state"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  function format_date(date: Date): string {
    return date.toLocaleDateString("es-AR")
  }

  function format_time(date: Date): string {
    return date.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }
</script>

<Content.Root>
  <Content.Title>Calendario de visitas</Content.Title>
  <Content.Header>
    <p class="text-gray-600">
      {data.property.location.road}
      {data.property.location.house_number}
    </p>
  </Content.Header>
  <Content.Section>
    <Section.Header>
      <Section.Title>Crear nuevo horario</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={`?/${ACTION.CREATE_SLOT}`}
    >
      <Formulary.Fields>
        <Formulary.Field>
          <Formulary.Label for="date">Fecha</Formulary.Label>
          <input type="date" id="date" name="date" required />
        </Formulary.Field>
        <Formulary.Field>
          <Formulary.Label for="start_time"
            >Hora inicio</Formulary.Label
          >
          <input
            type="time"
            id="start_time"
            name="start_time"
            required
          />
        </Formulary.Field>
        <Formulary.Field>
          <Formulary.Label for="end_time"
            >Hora fin</Formulary.Label
          >
          <input
            type="time"
            id="end_time"
            name="end_time"
            required
          />
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Crear horario</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
  <Content.Section>
    <Section.Header>
      <Section.Title>Horarios existentes</Section.Title>
    </Section.Header>
    {#if data.slots.length === 0}
      <p>No hay horarios creados.</p>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Fecha</Table.Cell>
          <Table.Cell header>Hora inicio</Table.Cell>
          <Table.Cell header>Hora fin</Table.Cell>
          <Table.Cell header>Estado</Table.Cell>
          <Table.Cell header>Acciones</Table.Cell>
        </Table.Header>
        <Table.Body>
          {#each data.slots as slot (slot.id)}
            <Table.Row>
              <Table.Cell
                >{format_date(slot.start_date)}</Table.Cell
              >
              <Table.Cell
                >{format_time(slot.start_date)}</Table.Cell
              >
              <Table.Cell
                >{format_time(slot.end_date)}</Table.Cell
              >
              <Table.Cell
                >{get_slot_state_label(slot.state)}</Table.Cell
              >
              <Table.Cell>
                {#if slot.state === SLOT_STATE.FREE}
                  <Formulary.Root
                    method="POST"
                    action={`?/${ACTION.DESTROY_SLOT}`}
                    style="display: inline;"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={slot.id}
                    />
                    <Button type="submit">Eliminar</Button>
                  </Formulary.Root>
                {:else}
                  <span class="text-gray-400">-</span>
                {/if}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
  </Content.Section>
</Content.Root>

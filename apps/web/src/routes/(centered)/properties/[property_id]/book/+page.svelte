<script lang="ts">
  import { page } from "$app/state"
  import { replaceState } from "$app/navigation"
  import * as Breadcrumb from "$lib/components/Breadcrumb"
  import SafeAddress from "$lib/components/SafeAddress.svelte"
  import * as Dialog from "$lib/components/Dialog"
  import * as Content from "$lib/components/Content"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import Togglable from "$lib/components/Togglable.svelte"
  import { has_action_error } from "$lib/has_action_error"
  import { compose_action } from "$lib/compose_action"
  import { get_date } from "$lib/date"
  import { ACTION } from "./actions/action"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()

  const TIMEZONE = "America/Argentina/Buenos_Aires"

  function group_by_day(slots: typeof data.slots) {
    const map = new Map<string, typeof data.slots>()
    for (const slot of slots) {
      const key = get_date(slot.start_date)
      const existing = map.get(key) ?? []
      existing.push(slot)
      map.set(key, existing)
    }
    return map
  }

  const slots_by_day = $derived(group_by_day(data.slots))
  const days = $derived([...slots_by_day.keys()])

  const initial_day = (() => {
    if (data.slots.length === 0) return ""
    const first_day = get_date(data.slots[0].start_date)
    if (data.date) {
      const has_date = data.slots.some(
        (slot) => get_date(slot.start_date) === data.date,
      )
      return has_date ? data.date : first_day
    }
    return first_day
  })()

  let selected_day = $state(initial_day)
  let selected_slot_id: number | null = $state(null)
  let confirmation_dialog_element:
    | HTMLDialogElement
    | undefined = $state()
  let credit_confirmation_dialog_element:
    | HTMLDialogElement
    | undefined = $state()

  function handle_confirm_click() {
    if (data.has_credit_report) {
      confirmation_dialog_element?.showModal()
    } else {
      credit_confirmation_dialog_element?.showModal()
    }
  }

  const selected_day_slots = $derived(
    slots_by_day.get(selected_day) ?? [],
  )

  const selected_slot = $derived(
    selected_slot_id !== null
      ? (selected_day_slots.find(
          (slot) => slot.id === selected_slot_id,
        ) ?? null)
      : null,
  )

  function handle_day_select(day: string) {
    selected_day = day
    selected_slot_id = null
    const url = new URL(window.location.href)
    url.searchParams.set("date", day)
    replaceState(url, {})
  }

  function handle_slot_select(slot_id: number) {
    selected_slot_id = slot_id
  }

  function format_day_name(date: Date) {
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: TIMEZONE,
      weekday: "long",
    }).format(new Date(date))
  }

  function format_day_date(date: Date) {
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: TIMEZONE,
      day: "numeric",
      month: "long",
    }).format(new Date(date))
  }

  function format_time(date: Date) {
    return new Intl.DateTimeFormat("es-AR", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(date))
  }

  function format_confirmation(date: Date) {
    const date_part = new Intl.DateTimeFormat("es-AR", {
      timeZone: TIMEZONE,
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date(date))
    const time_part = format_time(date)
    return `${date_part}, a las ${time_part}`
  }
</script>

{#snippet DayColumn()}
  <div class="column">
    <h2 class="heading-md">Día</h2>
    <div class="cards">
      {#each days as day (day)}
        {@const first_slot = slots_by_day.get(day)?.[0]}
        {#if first_slot}
          <Togglable
            active={selected_day === day}
            onclick={() => handle_day_select(day)}
          >
            <span class="body-md-medium day-name">
              {format_day_name(first_slot.start_date)}
            </span>
            <span class="body-md-bold day-date">
              {format_day_date(first_slot.start_date)}
            </span>
          </Togglable>
        {/if}
      {/each}
    </div>
  </div>
{/snippet}

{#snippet HourColumn()}
  <div class="column">
    <h2 class="heading-md">Horario</h2>
    <div class="cards">
      {#each selected_day_slots as slot (slot.id)}
        <Togglable
          active={selected_slot_id === slot.id}
          onclick={() => handle_slot_select(slot.id)}
        >
          <span class="body-md-bold hour">
            {format_time(slot.start_date)}
          </span>
        </Togglable>
      {/each}
    </div>
  </div>
{/snippet}

{#snippet ConfirmationBar()}
  {#if selected_slot}
    <div class="confirmation">
      <div class="confirmation-text">
        <span class="body-md-medium confirmation-label"
          >Tu visita será el día:</span
        >
        <span class="body-md-bold confirmation-date">
          {format_confirmation(selected_slot.start_date)}
        </span>
      </div>
      <Button
        variant="primary"
        type="button"
        onclick={handle_confirm_click}
        >Confirmar visita</Button
      >
    </div>
    <Dialog.Root bind:element={confirmation_dialog_element}>
      {#snippet children({ close })}
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>¿Confirmar visita?</Dialog.Title>
            <Dialog.Close onclick={close} />
          </Dialog.Header>
          <p class="body-md-bold confirmation-date">
            {format_confirmation(selected_slot.start_date)}
          </p>
          {#if has_action_error(form, "update_slot")}
            {#if form.errors.update_slot.execution}
              <Formulary.Error>
                {form.errors.update_slot.execution}
              </Formulary.Error>
            {/if}
          {/if}
          <Dialog.Actions>
            <Button
              variant="secondary"
              type="button"
              onclick={close}>Cancelar</Button
            >
            <Formulary.Root
              method="POST"
              action={compose_action(ACTION.UPDATE_SLOT)}
            >
              <input
                type="hidden"
                name="id"
                value={selected_slot.id}
              />
              <input
                type="hidden"
                name="visitant_id"
                value={data.user.id}
              />
              <input
                type="hidden"
                name="date"
                value={new Date(
                  selected_slot.start_date,
                ).toISOString()}
              />
              <Button variant="primary" type="submit"
                >Confirmar</Button
              >
            </Formulary.Root>
          </Dialog.Actions>
        </Dialog.Content>
      {/snippet}
    </Dialog.Root>
    <Dialog.Root
      bind:element={credit_confirmation_dialog_element}
    >
      {#snippet children({ close })}
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title
              >Informe crediticio requerido</Dialog.Title
            >
            <Dialog.Close onclick={close} />
          </Dialog.Header>
          <p class="body-md-medium confirmation-label">
            Para agendar una visita necesitás tener un
            informe crediticio cargado en tu perfil.
          </p>
          <a
            class="body-md-medium link"
            href="/learn/booking"
            target="_blank"
            >¿Qué es un informe crediticio?</a
          >
          <p class="body-md-medium footer">
            ¿Estás listo para subir tu informe?
            <a href="/account#files" target="_blank"
              >Subir informe</a
            >
          </p>
        </Dialog.Content>
      {/snippet}
    </Dialog.Root>
  {/if}
{/snippet}

<Content.Root>
  {#if data.property_location}
    <Breadcrumb.Root>
      <Breadcrumb.Link href="/properties"
        >Propiedades</Breadcrumb.Link
      >
      <Breadcrumb.Link
        href="/properties/{page.params.property_id}"
      >
        <SafeAddress
          house_number={data.property_location.house_number}
          placement="bottom"
        >
          {data.property_location.road}
          {data.property_location.house_number}
        </SafeAddress>
      </Breadcrumb.Link>
      <Breadcrumb.Current>Reservar</Breadcrumb.Current>
    </Breadcrumb.Root>
  {/if}
  <Content.Title>Seleccioná día y horario</Content.Title>
  {#if data.slots.length === 0}
    <p class="empty">No hay turnos disponibles.</p>
  {:else}
    <div class="columns">
      {@render DayColumn()}
      {@render HourColumn()}
    </div>
    {@render ConfirmationBar()}
  {/if}
</Content.Root>

<style>
  .columns {
    display: flex;
    gap: var(--dimension-spacing-10);
  }

  .column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .cards {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .day-name {
    color: var(--color-neutrals-500);
  }

  .day-name::first-letter {
    text-transform: uppercase;
  }

  .day-date {
    color: var(--color-neutrals-700);
  }

  .hour {
    color: var(--color-neutrals-700);
  }

  .confirmation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--dimension-spacing-4);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-lg);
  }

  .confirmation-text {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
  }

  .confirmation-label {
    color: var(--color-neutrals-500);
  }

  .confirmation-date {
    color: var(--color-neutrals-700);
  }

  .link {
    color: var(--color-blue-500);
    width: fit-content;
  }

  .footer {
    display: flex;
    gap: var(--dimension-spacing-2);
    align-items: center;
    color: var(--color-text-body);
  }

  .empty {
    color: var(--color-text-body);
  }
</style>

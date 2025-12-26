<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import { get_date } from "$lib/date"
  import { display_date } from "$lib/display_date"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()
</script>

<Content.Root>
  <Content.Title>Reservar visita</Content.Title>
  <Content.Section>
    <Section.Header>
      <Section.Title>seleccionar fecha</Section.Title>
    </Section.Header>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.SET_DATE)}
    >
      <Formulary.Fields>
        <fieldset>
          <legend>Fechas disponibles</legend>
          <div class="flex flex-col gap-2">
            {#each data.dates as date_item}
              {@const date_string = get_date(
                date_item.date,
              )}
              <label class="flex items-center gap-2">
                <input
                  type="radio"
                  name="date"
                  value={date_string}
                />
                <time datetime={date_string}>
                  {display_date(date_item.date, {
                    weekday: "short",
                    day: "numeric",
                    month: "numeric",
                  })}
                </time>
              </label>
            {/each}
          </div>
        </fieldset>
        {#if form?.errors && "set_date" in form.errors && form.errors.set_date?.date}
          <span class="text-red-500"
            >{form.errors.set_date.date}</span
          >
        {/if}
      </Formulary.Fields>
      <Formulary.Actions>
        <Button type="submit">Seleccionar fecha</Button>
      </Formulary.Actions>
    </Formulary.Root>
  </Content.Section>
  {#if data.times.length > 0}
    <Content.Section>
      <Section.Header>
        <Section.Title>seleccionar horario</Section.Title>
      </Section.Header>
      <Formulary.Root
        method="POST"
        action={compose_action(ACTION.UPDATE_SLOT)}
      >
        <Formulary.Fields>
          <fieldset>
            <legend class="sr-only"
              >Seleccionar un horario</legend
            >
            <div class="flex flex-col gap-2">
              {#each data.times as time (time.id)}
                <label class="flex items-center gap-2">
                  <input
                    type="radio"
                    name="id"
                    value={time.id}
                  />
                  <time
                    datetime={time.start_date.toISOString()}
                  >
                    {display_date(time.start_date, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    -
                    {display_date(time.end_date, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </time>
                </label>
              {/each}
            </div>
          </fieldset>
          {#if form?.errors && "update_slot" in form.errors && form.errors.update_slot?.id}
            <span class="text-red-500"
              >{form.errors.update_slot.id}</span
            >
          {/if}
          <input
            type="hidden"
            value={data.user.id}
            name="visitant_id"
          />
        </Formulary.Fields>
        <Formulary.Actions>
          <Button type="submit"
            >Reservar este horario</Button
          >
        </Formulary.Actions>
      </Formulary.Root>
    </Content.Section>
  {/if}
</Content.Root>

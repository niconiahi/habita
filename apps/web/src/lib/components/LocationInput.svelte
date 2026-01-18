<script module lang="ts">
  import * as v from "valibot"
  import { ForceNumberSchema } from "$lib/force_number"

  export const LocationSchema = v.object({
    place_id: v.number(),
    lat: v.union([
      v.pipe(v.string(), v.transform(Number)),
      v.number(),
    ]),
    lon: v.union([
      v.pipe(v.string(), v.transform(Number)),
      v.number(),
    ]),
    display_name: v.string(),
    address: v.object({
      road: v.string(),
      house_number: ForceNumberSchema,
      suburb: v.optional(v.string()),
      town: v.optional(v.string()),
      city: v.optional(v.string()),
      state: v.optional(v.string()),
    }),
  })

  export type Location = v.InferOutput<
    typeof LocationSchema
  >
</script>

<script lang="ts">
  import { safeParse } from "valibot"
  import { setup, assign } from "xstate"
  import { useMachine } from "@xstate/svelte"

  interface Props {
    default_value?: string
    default_lon?: string
    default_lat?: string
  }

  let {
    default_value = "",
    default_lon,
    default_lat,
  }: Props = $props()

  const id = "location_input"
  const list_id = `${id}_listbox`

  const locationMachine = setup({
    types: {
      context: {} as {
        query: string
        locations: Location[]
        selected: Location | null
        highlighted_index: number
      },
      events: {} as
        | { type: "TYPE"; value: string }
        | { type: "FETCH_START" }
        | { type: "FETCH_SUCCESS"; locations: Location[] }
        | { type: "FETCH_ERROR" }
        | { type: "NAVIGATE_DOWN" }
        | { type: "NAVIGATE_UP" }
        | { type: "SELECT"; location: Location }
        | { type: "ESCAPE" },
      input: {} as {
        default_value: string
      },
    },
    guards: {
      at_first_item: ({ context }) =>
        context.highlighted_index === 0,
      at_last_item: ({ context }) =>
        context.highlighted_index ===
        context.locations.length - 1,
    },
    actions: {
      set_query: assign({
        query: ({ event }) => {
          if (event.type === "TYPE") return event.value
          return ""
        },
      }),
      set_locations: assign({
        locations: ({ event }) => {
          if (event.type === "FETCH_SUCCESS")
            return event.locations
          return []
        },
        highlighted_index: ({ event }) => {
          if (event.type === "FETCH_SUCCESS") {
            return event.locations.length > 0 ? 0 : -1
          }
          return -1
        },
      }),
      clear_locations: assign({
        locations: () => [],
        selected: () => null,
      }),
      clear_for_escape: assign({
        locations: () => [],
      }),
      select_location: assign({
        selected: ({ event }) => {
          if (event.type === "SELECT") return event.location
          return null
        },
        query: ({ event }) => {
          if (event.type === "SELECT")
            return event.location.display_name
          return ""
        },
        locations: () => [],
      }),
      highlight_first: assign({
        highlighted_index: () => 0,
      }),
      highlight_last: assign({
        highlighted_index: ({ context }) =>
          context.locations.length - 1,
      }),
      highlight_next: assign({
        highlighted_index: ({ context }) =>
          context.highlighted_index + 1,
      }),
      highlight_previous: assign({
        highlighted_index: ({ context }) =>
          context.highlighted_index - 1,
      }),
      reset_highlight: assign({
        highlighted_index: () => -1,
      }),
      clear_selection: assign({
        selected: () => null,
      }),
      scroll_to_highlighted: ({ context }) => {
        const option = document.getElementById(
          `${list_id}_option_${context.highlighted_index}`,
        )
        option?.scrollIntoView({ block: "nearest" })
      },
    },
  }).createMachine({
    id: "location",
    initial: "idle",
    context: ({ input }) => ({
      query: input.default_value,
      locations: [],
      selected: null,
      highlighted_index: -1,
    }),
    states: {
      idle: {
        on: {
          TYPE: {
            target: "typing",
            actions: "set_query",
          },
        },
      },
      typing: {
        on: {
          TYPE: {
            actions: "set_query",
          },
          FETCH_START: "loading",
          ESCAPE: {
            target: "idle",
            actions: "clear_for_escape",
          },
        },
      },
      loading: {
        on: {
          FETCH_SUCCESS: {
            target: "showing_results",
            actions: "set_locations",
          },
          FETCH_ERROR: "typing",
        },
      },
      showing_results: {
        on: {
          TYPE: {
            target: "typing",
            actions: ["set_query", "clear_locations"],
          },
          NAVIGATE_DOWN: {
            target: "navigating",
            actions: [
              "highlight_first",
              "scroll_to_highlighted",
            ],
          },
          NAVIGATE_UP: {
            target: "navigating",
            actions: [
              "highlight_last",
              "scroll_to_highlighted",
            ],
          },
          SELECT: {
            target: "selected",
            actions: "select_location",
          },
          ESCAPE: {
            target: "idle",
            actions: "clear_for_escape",
          },
        },
      },
      navigating: {
        on: {
          NAVIGATE_UP: [
            {
              guard: "at_first_item",
              target: "showing_results",
              actions: "reset_highlight",
            },
            {
              actions: [
                "highlight_previous",
                "scroll_to_highlighted",
              ],
            },
          ],
          NAVIGATE_DOWN: [
            {
              guard: "at_last_item",
              target: "showing_results",
              actions: "reset_highlight",
            },
            {
              actions: [
                "highlight_next",
                "scroll_to_highlighted",
              ],
            },
          ],
          SELECT: {
            target: "selected",
            actions: "select_location",
          },
          ESCAPE: {
            target: "idle",
            actions: "clear_for_escape",
          },
        },
      },
      selected: {
        on: {
          TYPE: {
            target: "typing",
            actions: ["set_query", "clear_selection"],
          },
        },
      },
    },
  })
  const { snapshot, send } = useMachine(locationMachine, {
    input: { default_value },
  })
  let abort_controller: AbortController | null = null
  async function handle_input(event: Event) {
    const target = event.currentTarget as HTMLInputElement
    const value = target.value
    abort_controller?.abort()
    abort_controller = new AbortController()
    send({ type: "TYPE", value })
    if (value === "") {
      send({ type: "ESCAPE" })
      return
    }
    send({ type: "FETCH_START" })
    try {
      const url = new URL(
        "/nominatim/search",
        window.location.origin,
      )
      url.searchParams.set("q", value)
      url.searchParams.set("addressdetails", String(1))
      const response = await fetch(url, {
        signal: abort_controller.signal,
      })
      if (!response.ok) throw new Error("fetch failed")
      const data = await response.json()
      const valid_locations: Location[] = []
      for (const location_ of data) {
        const result = safeParse(LocationSchema, location_)
        if (result.success)
          valid_locations.push(result.output)
      }
      send({
        type: "FETCH_SUCCESS",
        locations: valid_locations,
      })
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        return
      }
      send({ type: "FETCH_ERROR" })
    }
  }
  function handle_keydown(event: KeyboardEvent) {
    if (
      !$snapshot.context.locations.length &&
      event.key !== "Escape"
    ) {
      return
    }
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        send({ type: "NAVIGATE_DOWN" })
        break
      case "ArrowUp":
        event.preventDefault()
        send({ type: "NAVIGATE_UP" })
        break
      case "Enter":
        event.preventDefault()
        if ($snapshot.context.highlighted_index >= 0) {
          send({
            type: "SELECT",
            location:
              $snapshot.context.locations[
                $snapshot.context.highlighted_index
              ],
          })
        }
        break
      case "Escape":
        event.preventDefault()
        send({ type: "ESCAPE" })
        break
    }
  }
  function handle_option_select(location: Location) {
    send({ type: "SELECT", location })
  }
</script>

<div>
  <label for={id}>Dirección</label>
  <div class="root">
    <div class="location">
      <input
        {id}
        class:navigating={$snapshot.matches("navigating")}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={list_id}
        aria-expanded={$snapshot.context.locations.length >
          0}
        aria-activedescendant={$snapshot.context
          .highlighted_index >= 0
          ? `${list_id}_option_${$snapshot.context.highlighted_index}`
          : undefined}
        value={$snapshot.context.query}
        oninput={handle_input}
        onkeydown={handle_keydown}
      />
      {#if $snapshot.context.locations.length}
        <ul role="listbox" id={list_id} class="listbox">
          {#each $snapshot.context.locations as location, index (location.place_id)}
            <li
              id={`${list_id}_option_${index}`}
              role="option"
              class="option"
              class:highlighted={$snapshot.matches("navigating") &&
                index ===
                  $snapshot.context.highlighted_index}
              aria-selected={index ===
                $snapshot.context.highlighted_index}
            >
              <button
                type="button"
                onclick={() =>
                  handle_option_select(location)}
              >
                {location.display_name}
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    {#if $snapshot.context.selected}
      <a
        class="button"
        href={`https://www.google.com/maps?q=${$snapshot.context.selected.lat},${$snapshot.context.selected.lon}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Google Maps
      </a>
    {:else if default_lat && default_lon}
      <a
        class="button"
        href={`https://www.google.com/maps?q=${default_lat},${default_lon}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        View on Google Maps
      </a>
    {/if}
  </div>
  <input
    type="hidden"
    name="location"
    value={JSON.stringify($snapshot.context.selected)}
  />
</div>

<style>
  .root {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .location {
    position: relative;
    flex: 1;
  }

  .location input {
    width: 100%;
  }

  .location input.navigating:focus-visible {
    outline: none;
  }

  .listbox {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    margin-top: var(--spacing-1);
    max-height: 300px;
    overflow-y: auto;
    background-color: var(--gray-700);
    border: 1px solid var(--gray-400);
    z-index: 10;
  }

  .option {
    min-height: var(--spacing-12);
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .option button {
    all: unset;
    width: 100%;
    padding: var(--spacing-2) var(--spacing-3);
    cursor: pointer;
  }

  .option:hover {
    background-color: var(--gray-600);
  }

  .option.highlighted {
    outline: 3px solid var(--accent);
    outline-offset: -3px;
  }
</style>

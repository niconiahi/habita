<script lang="ts">
  const QUERY_MINIMUM = 5
  import { untrack } from "svelte"
  import { setup, assign, createActor } from "xstate"

  interface ZoneItem {
    id: number
    label: string
    badge: string
  }

  interface Props {
    items: ZoneItem[]
    default_value?: ZoneItem | null
  }

  let { items, default_value = null }: Props = $props()

  function strip_diacritics(text: string): string {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
  }

  const id = "zone_input"
  const list_id = `${id}_listbox`

  const zone_machine = setup({
    types: {
      context: {} as {
        query: string
        items: ZoneItem[]
        selected: ZoneItem | null
        highlighted_index: number
      },
      events: {} as
        | { type: "TYPE"; value: string }
        | { type: "FILTER_SUCCESS"; items: ZoneItem[] }
        | { type: "NAVIGATE_DOWN" }
        | { type: "NAVIGATE_UP" }
        | { type: "SELECT"; item: ZoneItem }
        | { type: "ESCAPE" },
      input: {} as {
        default_value: ZoneItem | null
      },
    },
    guards: {
      at_first_item: ({ context }) =>
        context.highlighted_index === 0,
      at_last_item: ({ context }) =>
        context.highlighted_index ===
        context.items.length - 1,
    },
    actions: {
      set_query: assign({
        query: ({ event }) => {
          if (event.type === "TYPE") return event.value
          return ""
        },
      }),
      set_items: assign({
        items: ({ event }) => {
          if (event.type === "FILTER_SUCCESS")
            return event.items
          return []
        },
        highlighted_index: ({ event }) => {
          if (event.type === "FILTER_SUCCESS") {
            return event.items.length > 0 ? 0 : -1
          }
          return -1
        },
      }),
      clear_items: assign({
        items: () => [],
        selected: () => null,
      }),
      clear_for_escape: assign({
        items: () => [],
      }),
      select_item: assign({
        selected: ({ event }) => {
          if (event.type === "SELECT") return event.item
          return null
        },
        query: ({ event }) => {
          if (event.type === "SELECT")
            return event.item.label
          return ""
        },
        items: () => [],
      }),
      highlight_first: assign({
        highlighted_index: () => 0,
      }),
      highlight_last: assign({
        highlighted_index: ({ context }) =>
          context.items.length - 1,
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
    id: "zone",
    initial: "idle",
    context: ({ input }) => ({
      query: input.default_value?.label ?? "",
      items: [],
      selected: input.default_value,
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
          FILTER_SUCCESS: {
            target: "showing_results",
            actions: "set_items",
          },
          ESCAPE: {
            target: "idle",
            actions: "clear_for_escape",
          },
        },
      },
      showing_results: {
        on: {
          TYPE: {
            target: "typing",
            actions: ["set_query", "clear_items"],
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
            actions: "select_item",
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
            actions: "select_item",
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

  const actor = createActor(zone_machine, {
    input: {
      default_value: untrack(() => default_value),
    },
  })
  actor.start()

  let snapshot = $state(actor.getSnapshot())

  $effect(() => {
    const subscription = actor.subscribe((next) => {
      snapshot = next
    })
    return () => {
      subscription.unsubscribe()
      actor.stop()
    }
  })

  const send = actor.send.bind(actor)

  function handle_input(event: Event) {
    const target = event.currentTarget as HTMLInputElement
    const value = target.value
    send({ type: "TYPE", value })
    if (value === "") {
      send({ type: "ESCAPE" })
      return
    }
    if (value.length < QUERY_MINIMUM) return
    const words = strip_diacritics(value)
      .split(/\s+/)
      .filter(Boolean)
    const next_items = items.filter((item) => {
      const label = strip_diacritics(item.label)
      return words.every((word) => label.includes(word))
    })
    send({ type: "FILTER_SUCCESS", items: next_items })
  }

  function handle_keydown(event: KeyboardEvent) {
    if (
      !snapshot.context.items.length &&
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
        if (snapshot.context.highlighted_index >= 0) {
          send({
            type: "SELECT",
            item: snapshot.context.items[
              snapshot.context.highlighted_index
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

  function handle_option_select(item: ZoneItem) {
    send({ type: "SELECT", item })
  }
</script>

<div>
  <label for={id}>Zona</label>
  <div class="zone">
    <input
      {id}
      class:navigating={snapshot.matches("navigating")}
      role="combobox"
      aria-autocomplete="list"
      aria-haspopup="listbox"
      aria-controls={list_id}
      aria-expanded={snapshot.context.items.length > 0}
      aria-activedescendant={snapshot.context
        .highlighted_index >= 0
        ? `${list_id}_option_${snapshot.context.highlighted_index}`
        : undefined}
      value={snapshot.context.query}
      oninput={handle_input}
      onkeydown={handle_keydown}
    />
    {#if snapshot.context.items.length}
      <ul role="listbox" id={list_id} class="listbox">
        {#each snapshot.context.items as item, index (item.id)}
          <li
            id={`${list_id}_option_${index}`}
            role="option"
            class="option"
            class:highlighted={snapshot.matches(
              "navigating",
            ) &&
              index === snapshot.context.highlighted_index}
            aria-selected={index ===
              snapshot.context.highlighted_index}
          >
            <button
              type="button"
              onclick={() => handle_option_select(item)}
            >
              <span>{item.label}</span>
              <span class="badge">{item.badge}</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}
  </div>
  {#if snapshot.context.selected}
    <input
      type="hidden"
      name="zone_id"
      value={snapshot.context.selected.id}
    />
  {/if}
</div>

<style>
  .zone {
    position: relative;
    flex: 1;
  }

  .zone input {
    width: 100%;
  }

  .zone input.navigating:focus-visible {
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
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--spacing-2);
  }

  .badge {
    border: 1px solid var(--gray-400);
    padding: var(--spacing-1) var(--spacing-2);
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .option:hover {
    background-color: var(--gray-600);
  }

  .option.highlighted {
    outline: 3px solid var(--accent);
    outline-offset: -3px;
  }
</style>

<script lang="ts">
  import { untrack } from "svelte"
  import * as v from "valibot"
  import {
    LocationSchema,
    type Location,
  } from "./LocationInput.schemas"

  interface Props {
    default_value?: string
    default_lon?: string
    default_lat?: string
    onselection: () => void
    onclear: () => void
  }

  let {
    default_value = "",
    default_lon,
    default_lat,
    onselection,
    onclear,
  }: Props = $props()

  let query = $state(untrack(() => default_value))
  let locations = $state<Location[]>([])
  let selected = $state<Location | null>(null)
  let highlighted_index = $state(-1)
  let is_navigating = $state(false)

  $effect(() => {
    if (locations.length > 0) {
      highlighted_index = 0
    } else {
      highlighted_index = -1
    }
    is_navigating = false
  })

  $effect(() => {
    if (is_navigating && highlighted_index >= 0) {
      const option = document.getElementById(
        `${list_id}_option_${highlighted_index}`,
      )
      option?.scrollIntoView({ block: "nearest" })
    }
  })

  const id = "location_input"
  const list_id = `${id}_listbox`

  async function handle_input(event: Event) {
    const target = event.currentTarget as HTMLInputElement
    const value = target.value
    query = value
    is_navigating = false

    if (value.length >= 1) {
      selected = null
      onclear()
    }

    const url = new URL(
      "/nominatim/search",
      window.location.origin,
    )
    url.searchParams.set("q", value)
    url.searchParams.set("addressdetails", String(1))

    const response = await fetch(url).catch(() => {
      throw new Error(
        "unknown error while searching for an address",
      )
    })

    if (!response.ok) {
      throw new Error(
        "there was an error while searching for an address",
      )
    }

    const data = await response.json()
    const valid_locations: Location[] = []

    for (const location_ of data) {
      const result = v.safeParse(LocationSchema, location_)
      if (result.success) {
        valid_locations.push(result.output)
      }
    }

    locations = valid_locations
  }

  function handle_select(location: Location) {
    selected = location
    onselection()
    query = location.display_name
    locations = []
  }

  function handle_keydown(event: KeyboardEvent) {
    if (!locations.length) return

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault()
        if (!is_navigating) {
          is_navigating = true
          highlighted_index = 0
        } else if (
          highlighted_index <
          locations.length - 1
        ) {
          highlighted_index = highlighted_index + 1
        } else {
          is_navigating = false
        }
        break
      case "ArrowUp":
        event.preventDefault()
        if (!is_navigating) {
          is_navigating = true
          highlighted_index = locations.length - 1
        } else if (highlighted_index > 0) {
          highlighted_index = highlighted_index - 1
        } else {
          is_navigating = false
        }
        break
      case "Enter":
        event.preventDefault()
        if (highlighted_index >= 0) {
          handle_select(locations[highlighted_index])
        }
        break
      case "Escape":
        event.preventDefault()
        locations = []
        break
    }
  }
</script>

<div>
  <label for={id}>Dirección</label>
  <div class="root">
    <div class="location">
      <input
        {id}
        class:navigating={is_navigating}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-controls={list_id}
        aria-expanded={Boolean(locations.length)}
        aria-activedescendant={highlighted_index >= 0
          ? `${list_id}_option_${highlighted_index}`
          : undefined}
        value={query}
        oninput={handle_input}
        onkeydown={handle_keydown}
      />
      {#if locations.length}
        <ul role="listbox" id={list_id} class="listbox">
          {#each locations as location, index (location.place_id)}
            <li
              id={`${list_id}_option_${index}`}
              role="option"
              class="option"
              class:highlighted={is_navigating &&
                index === highlighted_index}
              aria-selected={index === highlighted_index}
              onclick={() => handle_select(location)}
            >
              {location.display_name}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    {#if selected}
      <a
        class="button"
        href={`https://www.google.com/maps?q=${selected.lat},${selected.lon}`}
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
    value={JSON.stringify(selected)}
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
    padding: var(--spacing-2) var(--spacing-3);
    cursor: pointer;
    display: flex;
    align-items: center;
  }

  .option:hover {
    background-color: var(--gray-600);
  }

  .option.highlighted {
    outline: 3px solid var(--accent);
    outline-offset: -3px;
  }
</style>

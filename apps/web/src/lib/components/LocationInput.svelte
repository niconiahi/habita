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

  const id = "location_input"
  const list_id = `${id}_listbox`

  async function handle_input(event: Event) {
    const target = event.currentTarget as HTMLInputElement
    const value = target.value
    query = value

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
</script>

<div>
  <label for={id}>Dirección</label>
  <input
    {id}
    style="min-width: 400px"
    role="combobox"
    aria-autocomplete="list"
    aria-haspopup="listbox"
    aria-controls={list_id}
    aria-expanded={Boolean(locations.length)}
    value={query}
    oninput={handle_input}
  />
  {#if locations.length}
    <ul role="listbox" id={list_id}>
      {#each locations as location (location.place_id)}
        <li
          role="option"
          aria-selected="false"
          onclick={() => handle_select(location)}
          onkeydown={() => handle_select(location)}
        >
          {location.display_name}
        </li>
      {/each}
    </ul>
  {/if}
  <input
    type="hidden"
    name="location"
    value={JSON.stringify(selected)}
  />
  {#if selected}
    <a
      href={`https://www.google.com/maps?q=${selected.lat},${selected.lon}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      View on Google Maps
    </a>
  {:else if default_lat && default_lon}
    <a
      href={`https://www.google.com/maps?q=${default_lat},${default_lon}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      View on Google Maps
    </a>
  {/if}
</div>

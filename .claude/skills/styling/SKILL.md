---
name: styling
description: CSS and styling conventions. Use when adding styles, creating CSS files, or applying Tailwind classes to components.
---

This skill guides how styling should be implemented across the application

1. Preference of writting CSS as native `.css` files, within the same `.svelte` files
2. No BEM, preference for local representative and short class names, like this:
3. Preference for `.css` nesting for parent/child relationship, as opposed to BEM approach of `Input`/`Input__Icon`

```svelte
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
              class:highlighted={$snapshot.matches(
                "navigating",
              ) &&
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
```

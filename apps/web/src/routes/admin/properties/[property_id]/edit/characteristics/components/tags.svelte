<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import {
    get_current_disclosure,
    set_current_disclosure,
  } from "$lib/disclousure_cookie.remote"
  import {
    PROPERTY_TAG_CATEGORIES,
    get_property_tag_type_label,
  } from "$lib/property_tag_type"
  import { update_property_tags } from "../forms/update_property_tags.remote"
  import type { PageData } from "../$types"

  let { data }: { data: PageData } = $props()

  const current = get_current_disclosure("characteristics")

  const active_tag_types = $derived(
    new Set(data.property.tags.map((t) => t.type)),
  )

  const issues = $derived(
    update_property_tags.fields.types.issues(),
  )

  function checkbox_attrs(tag_type: number) {
    return (
      update_property_tags.fields.types as unknown as {
        as: (
          type: "checkbox",
          value: string,
        ) => Record<string, unknown>
      }
    ).as("checkbox", String(tag_type))
  }
</script>

<Disclosure
  title="Tags"
  name="characteristics"
  open={(await current) === "tags"}
  onclick={(event) => {
    event.preventDefault()
    set_current_disclosure({
      key: "characteristics",
      value: current.current === "tags" ? "" : "tags",
    })
  }}
>
  <form
    {...update_property_tags.enhance(async ({ submit }) => {
      const ok = await submit()
      if (ok) await invalidateAll()
    })}
  >
    <input
      type="hidden"
      name="property_id"
      value={data.property.id}
    />
    {#each PROPERTY_TAG_CATEGORIES as category}
      <fieldset class="tag-category">
        <legend>{category.label}</legend>
        <div class="checkbox-list">
          {#each category.tags as tag_type}
            <label class="checkbox-label">
              <input
                {...checkbox_attrs(tag_type)}
                checked={active_tag_types.has(tag_type)}
              />
              {get_property_tag_type_label(tag_type)}
            </label>
          {/each}
        </div>
      </fieldset>
    {/each}
    {#if issues}
      {#each issues as issue}
        <Formulary.Error>{issue.message}</Formulary.Error>
      {/each}
    {/if}
    <Button variant="primary" type="submit">Guardar tags</Button>
  </form>
</Disclosure>

<style>
  .checkbox-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .tag-category {
    border: none;
    padding: 0;
    margin: 0 0 1rem;
  }

  .tag-category legend {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }
</style>

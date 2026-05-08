<script lang="ts">
  import { enhance } from "$app/forms"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import Disclosure from "$lib/components/Disclosure.svelte"
  import LocationInput from "$lib/components/LocationInput.svelte"

  import {
    get_property_destinies,
    get_property_destiny_label,
  } from "$lib/property_destiny"
  import {
    PROPERTY_TAG_CATEGORIES,
    get_property_tag_type_label,
  } from "$lib/property_tag_type"
  import {
    get_service_type_label,
    SERVICE_TYPE,
    type ServiceType,
  } from "$lib/service"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "../actions/action"
  import type { PageData, ActionData } from "./$types"

  let { data, form }: { data: PageData; form: ActionData } =
    $props()

  const property_destinies = get_property_destinies()
  const active_tag_types = $derived(
    new Set(data.property.tags.map((t) => t.type)),
  )
  const all_services_added = $derived(
    data.property.services.length ===
      Object.keys(SERVICE_TYPE).length,
  )
  const used_service_types = $derived(
    new Set(data.property.services.map((s) => s.type)),
  )
</script>

{#snippet Location()}
  <Disclosure title="Ubicación" name="characteristics" open>
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_LOCATION)}
    >
      {#snippet children({ submit_state })}
        <Formulary.Fields>
          <input
            type="hidden"
            value={data.property.location.id}
            name="id"
          />
          <LocationInput
            default_value={data.property.location.address}
            default_lon={String(
              data.property.location.longitude,
            )}
            default_lat={String(
              data.property.location.latitude,
            )}
          />
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            variant="primary"
            type="submit"
            disabled={submit_state === "busy"}
          >
            <Formulary.SubmitLabel
              state={submit_state}
              idle="Guardar ubicación"
              busy="Guardando ubicación..."
            done="Guardado"
            error="No se pudo guardar"
            />
          </Button>
        </Formulary.Actions>
      {/snippet}
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet Destinies()}
  <Disclosure title="Destino" name="characteristics">
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.UPDATE_DESTINIES)}
    >
      {#snippet children({ submit_state })}
        <Formulary.Fields>
          <Formulary.Field>
            <Formulary.Label>tipos</Formulary.Label>
            <fieldset class="checkbox-list">
              {#each property_destinies as destiny}
                {@const is_checked =
                  data.property.destinies.includes(destiny)}
                <label class="checkbox-label">
                  <input
                    type="checkbox"
                    name="destiny"
                    value={destiny}
                    checked={is_checked}
                  />
                  {get_property_destiny_label(destiny)}
                </label>
              {/each}
            </fieldset>
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            variant="primary"
            type="submit"
            disabled={submit_state === "busy"}
          >
            <Formulary.SubmitLabel
              state={submit_state}
              idle="Guardar destino"
              busy="Guardando destino..."
            done="Guardado"
            error="No se pudo guardar"
            />
          </Button>
        </Formulary.Actions>
      {/snippet}
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet Tags()}
  <Disclosure title="Tags" name="characteristics">
    {#each PROPERTY_TAG_CATEGORIES as category}
      <fieldset class="tag-category">
        <legend>{category.label}</legend>
        <div class="checkbox-list">
          {#each category.tags as tag_type}
            {@const is_checked =
              active_tag_types.has(tag_type)}
            <form
              method="POST"
              action={compose_action(ACTION.TOGGLE_TAG)}
              use:enhance
            >
              <input
                type="hidden"
                name="type"
                value={tag_type}
              />
              <label class="checkbox-label">
                <input
                  type="checkbox"
                  checked={is_checked}
                  onchange={(e) =>
                    e.currentTarget.form?.requestSubmit()}
                />
                {get_property_tag_type_label(tag_type)}
              </label>
            </form>
          {/each}
        </div>
      </fieldset>
    {/each}
  </Disclosure>
{/snippet}

{#snippet Building()}
  <Disclosure title="Edificio" name="characteristics">
    <Formulary.Root
      method="POST"
      action={compose_action(
        ACTION.UPDATE_CONSTRUCTION_YEAR,
      )}
    >
      {#snippet children({ submit_state })}
        <Formulary.Fields>
          <Formulary.Field>
            <Formulary.Label for="construction_year"
              >año de construcción</Formulary.Label
            >
            <input
              id="construction_year"
              type="number"
              name="construction_year"
              min={1900}
              max={2026}
              placeholder="2015"
              value={data.property.construction_year ?? ""}
            />
          </Formulary.Field>
        </Formulary.Fields>
        <Formulary.Actions>
          <Button
            variant="primary"
            type="submit"
            disabled={submit_state === "busy"}
          >
            <Formulary.SubmitLabel
              state={submit_state}
              idle="Guardar año"
              busy="Guardando año..."
            done="Guardado"
            error="No se pudo guardar"
            />
          </Button>
        </Formulary.Actions>
      {/snippet}
    </Formulary.Root>
  </Disclosure>
{/snippet}

{#snippet Services()}
  <Disclosure title="Servicios" name="characteristics">
    <ul>
      {#each data.property.services as service (`service_${service.id}`)}
        <li>
          <Formulary.Root method="POST">
            {#snippet children({ submit_state })}
              <Formulary.Fields>
                <input
                  type="hidden"
                  value={service.id}
                  name="id"
                />
                <Formulary.Field>
                  <Formulary.Label
                    for={`type_${service.id}`}
                    >tipo</Formulary.Label
                  >
                  <Formulary.Select
                    name="type"
                    id={`type_${service.id}`}
                    value={service.type}
                  >
                    {#each Object.values(SERVICE_TYPE) as type}
                      {#if type === service.type || !used_service_types.has(type)}
                        <option value={type}
                          >{get_service_type_label(
                            type as ServiceType,
                          )}</option
                        >
                      {/if}
                    {/each}
                  </Formulary.Select>
                </Formulary.Field>
                <Formulary.Field>
                  <Formulary.Label
                    for={`code_${service.id}`}
                    >identificador</Formulary.Label
                  >
                  <input
                    id={`code_${service.id}`}
                    type="number"
                    name="code"
                    value={service.code}
                  />
                </Formulary.Field>
              </Formulary.Fields>
              <Formulary.Actions>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={submit_state === "busy"}
                  formaction={compose_action(
                    ACTION.UPDATE_SERVICE,
                  )}
                >
                  <Formulary.SubmitLabel
                    state={submit_state}
                    idle="Guardar servicio"
                    busy="Guardando servicio..."
                  done="Guardado"
                  error="No se pudo guardar"
                  />
                </Button>
                <Button
                  variant="secondary"
                  type="submit"
                  disabled={submit_state === "busy"}
                  formaction={compose_action(
                    ACTION.DESTROY_SERVICE,
                  )}
                >
                  <Formulary.SubmitLabel
                    state={submit_state}
                    idle="Eliminar servicio"
                    busy="Eliminando servicio..."
                  done="Eliminado"
                  error="No se pudo eliminar"
                  /></Button
                >
              </Formulary.Actions>
            {/snippet}
          </Formulary.Root>
        </li>
      {/each}
    </ul>
    {#if form?.message}
      <p class="error">{form.message}</p>
    {/if}
    <form
      method="POST"
      action={compose_action(ACTION.CREATE_SERVICE)}
      use:enhance
    >
      <Button
        variant="secondary"
        type="submit"
        disabled={all_services_added}
        >Agregar servicio</Button
      >
    </form>
  </Disclosure>
{/snippet}

<h2 class="heading-sm tab-title">Características</h2>
{@render Location()}
{@render Destinies()}
{@render Tags()}
{@render Building()}
{@render Services()}

<style>
  .tab-title {
    color: var(--color-text-heading);
  }

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

  .error {
    color: rgb(239 68 68);
  }
</style>

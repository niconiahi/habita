<script lang="ts">
  import { invalidateAll } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import {
    SERVICE_TYPE,
    type ServiceType,
    get_service_type_label,
  } from "$lib/service"
  import { destroy_service } from "../forms/destroy_service.remote"
  import { update_service } from "../forms/update_service.remote"
  import type { PageData } from "../$types"

  type Service = PageData["property"]["services"][number]

  let {
    service,
    property_id,
    used_service_types,
  }: {
    service: Service
    property_id: number
    used_service_types: Set<number>
  } = $props()

  const update_form = $derived(
    update_service.for(service.id),
  )
  const destroy_form = $derived(
    destroy_service.for(service.id),
  )

  const type_issues = $derived(
    update_form.fields.type.issues(),
  )
  const code_issues = $derived(
    update_form.fields.code.issues(),
  )
</script>

<li class="service-card">
  <form
    id={`update_service_${service.id}`}
    {...update_form.enhance(async ({ submit }) => {
      const ok = await submit()
      if (ok) await invalidateAll()
    })}
  >
    <input type="hidden" name="id" value={service.id} />
    <input
      type="hidden"
      name="property_id"
      value={property_id}
    />
    <label for={`type_${service.id}`}>tipo</label>
    <select
      {...update_form.fields.type.as(
        "select",
        String(service.type),
      )}
      id={`type_${service.id}`}
    >
      {#each Object.values(SERVICE_TYPE) as type}
        {#if type === service.type || !used_service_types.has(type)}
          <option value={String(type)}>
            {get_service_type_label(type as ServiceType)}
          </option>
        {/if}
      {/each}
    </select>
    {#if type_issues}
      {#each type_issues as issue}
        <span class="form-error">{issue.message}</span>
      {/each}
    {/if}
    <label for={`code_${service.id}`}>identificador</label>
    <input
      {...update_form.fields.code.as("text", service.code)}
      id={`code_${service.id}`}
      type="number"
    />
    {#if code_issues}
      {#each code_issues as issue}
        <span class="form-error">{issue.message}</span>
      {/each}
    {/if}
  </form>
  <form
    id={`destroy_service_${service.id}`}
    {...destroy_form.enhance(async ({ submit }) => {
      const ok = await submit()
      if (ok) await invalidateAll()
    })}
  >
    <input type="hidden" name="id" value={service.id} />
    <input
      type="hidden"
      name="property_id"
      value={property_id}
    />
  </form>
  <div class="actions">
    <Formulary.Submission form={update_form}>
      {#snippet children({ is_busy, is_done })}
        <Button
          variant="primary"
          type="submit"
          form={`update_service_${service.id}`}
          disabled={is_busy()}
        >
          <Formulary.SubmissionLabel
            is_busy={is_busy()}
            is_done={is_done()}
            idle="Guardar servicio"
            busy="Guardando servicio..."
            done="Guardado"
          />
        </Button>
      {/snippet}
    </Formulary.Submission>
    <Formulary.Submission form={destroy_form}>
      {#snippet children({ is_busy, is_done })}
        <Button
          variant="secondary"
          type="submit"
          form={`destroy_service_${service.id}`}
          disabled={is_busy()}
        >
          <Formulary.SubmissionLabel
            is_busy={is_busy()}
            is_done={is_done()}
            idle="Eliminar servicio"
            busy="Eliminando servicio..."
            done="Eliminado"
          />
        </Button>
      {/snippet}
    </Formulary.Submission>
  </div>
</li>

<style>
  .service-card {
    border: 1px solid var(--color-border-primary);
    padding: 1rem;
    border-radius: var(--dimension-radius-md);
  }

  .actions {
    margin-top: var(--dimension-spacing-2);
    display: flex;
    gap: 0.5rem;
  }
</style>

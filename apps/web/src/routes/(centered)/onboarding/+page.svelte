<script lang="ts">
  import { goto } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import Togglable from "$lib/components/Togglable.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import { compose_action } from "$lib/compose_action"
  import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
  import { ACTION } from "./actions/action"

  const ACCOUNT_TYPE = {
    REALTOR: "realtor",
    TENANT: "tenant",
    FREELANCE: "freelance",
  } as const

  type AccountType =
    (typeof ACCOUNT_TYPE)[keyof typeof ACCOUNT_TYPE]

  let selected_type = $state<AccountType | null>(null)

  function handle_select(type: AccountType) {
    selected_type = selected_type === type ? null : type
  }

  function get_subscription_type(
    type: AccountType,
  ): number | null {
    if (type === ACCOUNT_TYPE.REALTOR)
      return SUBSCRIPTION_TYPE.REALTOR
    if (type === ACCOUNT_TYPE.FREELANCE)
      return SUBSCRIPTION_TYPE.FREELANCE
    return null
  }
</script>

{#snippet RealtorOption()}
  <Togglable
    active={selected_type === ACCOUNT_TYPE.REALTOR}
    onclick={() => handle_select(ACCOUNT_TYPE.REALTOR)}
  >
    <div class="option">
      <h3 class="heading-sm option-title">Inmobiliaria</h3>
      <p class="body-md-medium option-description">
        Tengo o manejo una inmobilaria y tengo un equipo de
        asesores inmobiliarios que trabajan conmigo
      </p>
    </div>
  </Togglable>
{/snippet}

{#snippet TenantOption()}
  <Togglable
    active={selected_type === ACCOUNT_TYPE.TENANT}
    onclick={() => handle_select(ACCOUNT_TYPE.TENANT)}
  >
    <div class="option">
      <h3 class="heading-sm option-title">Inquilino</h3>
      <p class="body-md-medium option-description">
        Estoy en búsqueda de un departamento o una casa la
        cual alquilar
      </p>
    </div>
  </Togglable>
{/snippet}

{#snippet FreelanceOption()}
  <Togglable
    active={selected_type === ACCOUNT_TYPE.FREELANCE}
    onclick={() => handle_select(ACCOUNT_TYPE.FREELANCE)}
  >
    <div class="option">
      <h3 class="heading-sm option-title">
        Asesor inmobiliario
      </h3>
      <p class="body-md-medium option-description">
        Administro propiedades por mi cuenta y no pertenezco
        a ninguna inmobiliaria
      </p>
    </div>
  </Togglable>
{/snippet}

<div class="container">
  <h1 class="heading-lg title">
    Quiero una cuenta del tipo
  </h1>
  <Formulary.Root
    action={compose_action(ACTION.SELECT_ACCOUNT_TYPE)}
    method="POST"
    onsubmit={(event) => {
      if (selected_type === ACCOUNT_TYPE.TENANT) {
        event.preventDefault()
        goto("/profile")
      }
    }}
  >
    <div class="types">
      {@render RealtorOption()}
      {@render TenantOption()}
      {@render FreelanceOption()}
      {#if selected_type && selected_type !== ACCOUNT_TYPE.TENANT}
        <input
          type="hidden"
          name="type"
          value={get_subscription_type(selected_type)}
        />
      {/if}
      <div class="actions">
        <Button
          variant="primary"
          type="submit"
          disabled={selected_type === null}
        >
          Confirmar tipo de cuenta
        </Button>
      </div>
    </div>
  </Formulary.Root>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
    padding-top: var(--dimension-spacing-10);
  }

  .title {
    color: var(--color-text-heading);
  }

  .types {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2-5);
    align-items: flex-end;
  }

  .actions {
    margin-top: var(--dimension-spacing-2-5);
  }

  .option {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .option-title {
    color: var(--color-text-heading);
  }

  .option-description {
    color: var(--color-text-body);
  }
</style>

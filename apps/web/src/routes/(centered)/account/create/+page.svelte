<script lang="ts">
  import { goto } from "$app/navigation"
  import Button from "$lib/components/Button.svelte"
  import * as Formulary from "$lib/components/Formulary"
  import Togglable from "$lib/components/Togglable.svelte"
  import { compose_action } from "$lib/compose_action"
  import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
  import { ACTION } from "./actions/action"

  let { data } = $props()

  const INTENT = {
    BROWSE: "browse",
    MANAGE: "manage",
  } as const

  type Intent = (typeof INTENT)[keyof typeof INTENT]

  let selected_intent = $state<Intent | null>(null)
  let selected_subscription_type = $state<number | null>(
    null,
  )

  function handle_select_intent(intent: Intent) {
    selected_intent =
      selected_intent === intent ? null : intent
    selected_subscription_type = null
  }

  function handle_select_subscription_type(type: number) {
    selected_subscription_type =
      selected_subscription_type === type ? null : type
  }

  const has_freelance = $derived(
    data.existing_subscription_types.includes(
      SUBSCRIPTION_TYPE.FREELANCE,
    ),
  )
</script>

{#snippet BrowseOption()}
  <Togglable
    active={selected_intent === INTENT.BROWSE}
    onclick={() => handle_select_intent(INTENT.BROWSE)}
  >
    <div class="option">
      <h3 class="heading-sm option-title">
        Buscar propiedades
      </h3>
      <p class="body-md-medium option-description">
        Solo quiero buscar propiedades para alquilar
      </p>
    </div>
  </Togglable>
{/snippet}

{#snippet ManageOption()}
  <Togglable
    active={selected_intent === INTENT.MANAGE}
    onclick={() => handle_select_intent(INTENT.MANAGE)}
  >
    <div class="option">
      <h3 class="heading-sm option-title">
        Administrar propiedades
      </h3>
      <p class="body-md-medium option-description">
        Quiero administrar propiedades y gestionar
        alquileres
      </p>
    </div>
  </Togglable>
{/snippet}

{#snippet SubscriptionTypeOption(
  type: number,
  title: string,
  description: string,
)}
  <Togglable
    active={selected_subscription_type === type}
    onclick={() => handle_select_subscription_type(type)}
  >
    <div class="option">
      <h3 class="heading-sm option-title">{title}</h3>
      <p class="body-md-medium option-description">
        {description}
      </p>
    </div>
  </Togglable>
{/snippet}

<div class="container">
  <h1 class="heading-lg title">¿Qué querés hacer?</h1>
  <div class="steps">
    <div class="options">
      {@render BrowseOption()}
      {@render ManageOption()}
    </div>

    {#if selected_intent === INTENT.BROWSE}
      <div class="actions">
        <Button
          variant="primary"
          type="button"
          onclick={() => goto("/properties")}
        >
          Buscar propiedades
        </Button>
      </div>
    {/if}

    {#if selected_intent === INTENT.MANAGE}
      <div class="step-two">
        <h2 class="heading-md subtitle">
          ¿Cómo administrás?
        </h2>
        <Formulary.Root
          action={compose_action(ACTION.CREATE_ACCOUNT)}
          method="POST"
        >
          <div class="options">
            {#if !has_freelance}
              {@render SubscriptionTypeOption(
                SUBSCRIPTION_TYPE.FREELANCE,
                "Asesor inmobiliario",
                "Administro propiedades por mi cuenta y no pertenezco a ninguna inmobiliaria",
              )}
            {/if}
            {@render SubscriptionTypeOption(
              SUBSCRIPTION_TYPE.REALTOR,
              "Inmobiliaria",
              "Tengo o manejo una inmobiliaria y tengo un equipo de asesores inmobiliarios",
            )}
          </div>
          {#if selected_subscription_type !== null}
            <input
              type="hidden"
              name="type"
              value={selected_subscription_type}
            />
          {/if}
          <div class="actions">
            <Button
              variant="primary"
              type="submit"
              disabled={selected_subscription_type === null}
            >
              Crear cuenta
            </Button>
          </div>
        </Formulary.Root>
      </div>
    {/if}
  </div>
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

  .subtitle {
    color: var(--color-text-heading);
  }

  .steps {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
  }

  .step-two {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-4);
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2-5);
  }

  .actions {
    display: flex;
    justify-content: flex-end;
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

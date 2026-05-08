<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import { compose_action } from "$lib/compose_action"
  import { SUBSCRIPTION_STATUS } from "$lib/subscription_status"
  import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

{#snippet ActiveSubscription()}
  <Content.Section>
    <div class="status-card status-active">
      <h3>Tu suscripción está activa</h3>
      {#if data.has_subscription && data.ends_at}
        <p>
          Válida hasta el
          <strong>
            {new Date(data.ends_at).toLocaleDateString(
              "es-AR",
            )}
          </strong>
        </p>
      {/if}
    </div>
  </Content.Section>
{/snippet}

{#snippet PaymentForm()}
  <Content.Section>
    <div class="status-card status-due">
      {#if data.has_subscription && data.status === SUBSCRIPTION_STATUS.GRACE}
        <p class="warning">
          Tu suscripción venció. Renová para continuar
          usando Habita.
        </p>
      {:else}
        <p class="warning">
          Tu suscripción está bloqueada. Realizá el pago
          para continuar.
        </p>
      {/if}

      {#if data.has_subscription}
        <p class="amount">${data.amount} USD</p>
        {#if data.subscription_type === SUBSCRIPTION_TYPE.REALTOR}
          <p class="breakdown">
            {data.seat_count}
            {data.seat_count === 1 ? "puesto" : "puestos"} × $40
            USD
          </p>
        {/if}
        <Formulary.Root
          action={compose_action(
            ACTION.CREATE_SUBSCRIPTION_PAYMENT,
          )}
          method="POST"
        >
          {#snippet children({ submit_state })}
            <Button
              variant="primary"
              type="submit"
              disabled={submit_state === "busy"}
            >
              <Formulary.SubmitLabel
                state={submit_state}
                idle="Pagar"
                busy="Pagando..."
              done="Pagado"
              error="No se pudo pagar"
              />
            </Button>
          {/snippet}
        </Formulary.Root>
      {/if}
    </div>
  </Content.Section>
{/snippet}

{#snippet NonAdminMessage()}
  <Content.Section>
    <div class="status-card status-due">
      <p>Tu administrador debe renovar la suscripción.</p>
    </div>
  </Content.Section>
{/snippet}

<Content.Root>
  <Content.Title>Suscripción</Content.Title>

  {#if !data.has_subscription}
    <Content.Section>
      <p>No tenés una suscripción activa.</p>
    </Content.Section>
  {:else if data.status === SUBSCRIPTION_STATUS.ACTIVE}
    {@render ActiveSubscription()}
  {:else if !data.is_admin}
    {@render NonAdminMessage()}
  {:else}
    {@render PaymentForm()}
  {/if}
</Content.Root>

<style>
  .status-card {
    padding: var(--spacing-6);
    border-radius: 0.25rem;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .status-active {
    border: 2px solid var(--green-500, #22c55e);
    background-color: var(--gray-700);
    color: var(--gray-100);
  }

  .status-due {
    border: 2px solid var(--warning-border, #b45309);
    background-color: var(--gray-700);
    color: var(--gray-100);
  }

  .warning {
    color: var(--warning-text, #fef3c7);
    font-weight: 600;
  }

  .amount {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--gray-100);
  }

  .breakdown {
    color: var(--gray-300);
    font-size: 0.875rem;
  }
</style>

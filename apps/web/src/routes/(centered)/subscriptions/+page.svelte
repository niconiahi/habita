<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Formulary from "$lib/components/Formulary"
  import * as Table from "$lib/components/Table"
  import Button from "$lib/components/Button.svelte"
  import { display_date } from "$lib/display_date"
  import { get_subscription_status_label } from "$lib/subscription_status"
  import { get_subscription_type_label } from "$lib/subscription_type"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Title>Suscripciones</Content.Title>
  <Content.Section>
    {#if data.subscriptions.length === 0}
      <p>No tenés una suscripción.</p>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Tipo</Table.Cell>
          <Table.Cell header>Estado</Table.Cell>
          <Table.Cell header>Inicio</Table.Cell>
          <Table.Cell header>Fin</Table.Cell>
          <Table.Cell header>Acciones</Table.Cell>
        </Table.Header>
        <Table.Body>
          {#each data.subscriptions as subscription (subscription.id)}
            <Table.Row>
              <Table.Cell>
                {get_subscription_type_label(
                  subscription.type,
                )}
              </Table.Cell>
              <Table.Cell>
                {get_subscription_status_label(
                  subscription.status,
                )}
              </Table.Cell>
              <Table.Cell
                >{display_date(
                  subscription.starts_at,
                )}</Table.Cell
              >
              <Table.Cell
                >{display_date(
                  subscription.ends_at,
                )}</Table.Cell
              >
              <Table.Cell>
                <div class="actions">
                  <a
                    href={`/subscriptions/${subscription.id}/payments`}
                  >
                    <Button variant="secondary"
                      >Ver pagos</Button
                    >
                  </a>
                  {#if subscription.can_pay_next}
                    <Formulary.Root
                      method="POST"
                      action={compose_action(
                        ACTION.CREATE_SUBSCRIPTION_PAYMENT,
                      )}
                    >
                      {#snippet children({ submit_state })}
                        <input
                          type="hidden"
                          name="organization_id"
                          value={subscription.organization_id}
                        />
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
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
  </Content.Section>
</Content.Root>

<style>
  .actions {
    display: flex;
    gap: var(--dimension-spacing-2);
  }
</style>

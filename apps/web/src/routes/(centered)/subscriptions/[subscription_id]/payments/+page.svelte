<script lang="ts">
  import * as Breadcrumb from "$lib/components/Breadcrumb"
  import * as Content from "$lib/components/Content"
  import * as Formulary from "$lib/components/Formulary"
  import * as Table from "$lib/components/Table"
  import Button from "$lib/components/Button.svelte"
  import { display_date } from "$lib/display_date"
  import { get_payment_status_label } from "$lib/payment_status"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { PageData } from "./$types"

  const MP_ACTIVITY_BASE_URL =
    "https://www.mercadopago.com.ar/activities/detail"

  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Breadcrumb.Root>
    <Breadcrumb.Link href="/subscriptions"
      >Suscripciones</Breadcrumb.Link
    >
    <Breadcrumb.Current>Pagos</Breadcrumb.Current>
  </Breadcrumb.Root>
  <Content.Header>
    <Content.Title>Pagos de suscripción</Content.Title>
    {#if data.subscription.can_pay_next}
      <Content.Actions>
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
              value={data.subscription.organization_id}
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
      </Content.Actions>
    {/if}
  </Content.Header>
  <Content.Section>
    {#if data.payments.length === 0}
      <p>Aún no hay pagos registrados.</p>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Fecha</Table.Cell>
          <Table.Cell header>Estado</Table.Cell>
          <Table.Cell header>Mercado Pago</Table.Cell>
        </Table.Header>
        <Table.Body>
          {#each data.payments as payment (payment.payment_id)}
            <Table.Row>
              <Table.Cell
                >{display_date(
                  payment.payment_created_at,
                )}</Table.Cell
              >
              <Table.Cell
                >{get_payment_status_label(
                  payment.mp_status,
                )}</Table.Cell
              >
              <Table.Cell>
                {#if payment.operation_id}
                  <a
                    href={`${MP_ACTIVITY_BASE_URL}/${payment.operation_id}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {payment.operation_id}
                  </a>
                {:else}
                  <span>—</span>
                {/if}
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
  </Content.Section>
</Content.Root>

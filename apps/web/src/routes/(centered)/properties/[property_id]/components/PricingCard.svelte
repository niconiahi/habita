<script lang="ts">
  import { display_location } from "$lib/display_location"
  import { get_escalation_label } from "$lib/escalation_type"
  import SafeAddress from "$lib/components/SafeAddress.svelte"

  interface Props {
    location: {
      road: string
      house_number: number
      suburb: string | null
      city: string | null
      town: string | null
      state: string | null
    }
    initial_price: number | null
    expenses: number | null
    escalation_type: number | null
    escalation_frequency: number | null
  }

  let {
    location,
    initial_price,
    expenses,
    escalation_type,
    escalation_frequency,
  }: Props = $props()

  function format_currency(value: number) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      maximumFractionDigits: 0,
    }).format(value)
  }

  function format_address() {
    return display_location(location)
  }
</script>

<div class="card">
  <SafeAddress {location}>
    <h2 class="heading-md address">{format_address()}</h2>
  </SafeAddress>
  {#if initial_price}
    <div class="price-row">
      <span class="heading-sm price">
        {format_currency(initial_price)}
      </span>
      <span class="body-md-medium label">/Alquiler</span>
      {#if escalation_type !== null && escalation_frequency !== null}
        <span class="badge body-sm-medium">
          Ajuste cada {escalation_frequency} meses por {get_escalation_label(
            escalation_type,
          )}
        </span>
      {/if}
    </div>
  {/if}
  {#if expenses}
    <div class="price-row">
      <span class="heading-sm price">
        {format_currency(expenses)}
      </span>
      <span class="body-md-medium label"
        >/Expensas aproximadas</span
      >
    </div>
  {/if}
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
    padding: var(--dimension-spacing-4);
    border: 1px solid var(--color-border-primary);
    border-radius: var(--dimension-radius-xl);
  }

  .address {
    color: var(--color-text-heading);
  }

  .price-row {
    display: flex;
    align-items: baseline;
    gap: var(--dimension-spacing-2);
    flex-wrap: wrap;
  }

  .price {
    color: var(--color-text-heading);
  }

  .label {
    color: var(--color-text-body);
  }

  .badge {
    padding: var(--dimension-spacing-1)
      var(--dimension-spacing-3);
    background-color: var(--badge-bg);
    color: var(--badge-fg);
    border-radius: var(--dimension-radius-full);
  }
</style>

<script lang="ts">
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"
  import {
    get_rate_label,
    type RateType,
  } from "$lib/rate_type"
  import type { PageData } from "./$types"
  let { data }: { data: PageData } = $props()
</script>

<Content.Root>
  <Content.Title>Índice de actualización</Content.Title>
  <Content.Section>
    <p class="current-month">
      Mes actual: {data.current_month}/{data.current_year}
    </p>
    <div class="rate-list">
      {#each data.rate_types as type (type)}
        {@const existing_rate = data.rates.find(
          (rate) => rate.type === type,
        )}
        <form method="POST" class="rate-form">
          <input type="hidden" name="type" value={type} />
          <input
            type="hidden"
            name="month"
            value={data.current_month}
          />
          <input
            type="hidden"
            name="year"
            value={data.current_year}
          />
          <label for="value-{type}" class="rate-label">
            {get_rate_label(type as RateType)}
          </label>
          <input
            type="number"
            id="value-{type}"
            name="value"
            step="0.01"
            value={existing_rate?.value ?? ""}
            placeholder="Valor"
            class="rate-input"
            required
          />
          <Button variant="primary" type="submit"
            >Guardar</Button
          >
        </form>
      {/each}
    </div>
  </Content.Section>
</Content.Root>

<style>
  .current-month {
    margin-bottom: 1rem;
  }
  .rate-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .rate-form {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .rate-label {
    width: 8rem;
    font-weight: 500;
  }
  .rate-input {
    border: 1px solid;
    border-radius: 0.25rem;
    padding: 0.5rem 0.75rem;
    width: 12rem;
  }
</style>

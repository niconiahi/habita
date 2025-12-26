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
    <p class="mb-4">
      Mes actual: {data.current_month}/{data.current_year}
    </p>
    <div class="space-y-4">
      {#each data.rate_types as type (type)}
        {@const existing_rate = data.rates.find(
          (rate) => rate.type === type,
        )}
        <form method="POST" class="flex items-center gap-4">
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
          <label
            for="value-{type}"
            class="w-32 font-medium"
          >
            {get_rate_label(type as RateType)}
          </label>
          <input
            type="number"
            id="value-{type}"
            name="value"
            step="0.01"
            value={existing_rate?.value ?? ""}
            placeholder="Valor"
            class="border rounded px-3 py-2 w-48"
            required
          />
          <Button type="submit">Guardar</Button>
        </form>
      {/each}
    </div>
  </Content.Section>
</Content.Root>

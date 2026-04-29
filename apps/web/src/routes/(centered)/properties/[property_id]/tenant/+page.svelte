<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import { display_date } from "$lib/display_date"
  import { get_contract_file_type_label } from "$lib/contract_file_type"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()
</script>

{#snippet ContractInfo()}
  <Content.Section>
    <Section.Header>
      <Section.Title>Contrato</Section.Title>
    </Section.Header>
    <div class="info-list">
      {#if data.contract_end_date}
        <div class="info-row">
          <span class="info-label">Vencimiento</span>
          <span>
            {display_date(new Date(data.contract_end_date), {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: undefined,
              minute: undefined,
            })}
          </span>
        </div>
      {/if}
      {#each data.contract_files as file (file.id)}
        <div class="info-row">
          <span class="info-label">
            {get_contract_file_type_label(file.type)}
          </span>
          <a
            href="/files/{file.id}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Descargar
          </a>
        </div>
      {/each}
    </div>
  </Content.Section>
{/snippet}

{#snippet Manager()}
  {#if data.manager}
    <Content.Section>
      <Section.Header>
        <Section.Title>Administrador</Section.Title>
      </Section.Header>
      <div class="info-list">
        <div class="info-row">
          <span class="info-label">Nombre</span>
          <span
            >{data.manager.name} {data.manager.surname}</span
          >
        </div>
        {#if data.manager.phone_number}
          <div class="info-row">
            <span class="info-label">Teléfono</span>
            <a
              href="https://wa.me/{data.manager.phone_number.replace('+', '')}"
              target="_blank"
              rel="noopener noreferrer"
            >
              {data.manager.phone_number}
            </a>
          </div>
        {/if}
      </div>
    </Content.Section>
  {/if}
{/snippet}

{#snippet RentPrice()}
  <Content.Section>
    <Section.Header>
      <Section.Title>Precio de alquiler actual</Section.Title>
    </Section.Header>
    <p>${data.current_rent_price}</p>
  </Content.Section>
{/snippet}

{#snippet RentPeriods()}
  {#if data.periods.length > 1}
    <Content.Section>
      <Section.Header>
        <Section.Title>Períodos de alquiler</Section.Title>
      </Section.Header>
      <div class="info-list">
        {#each data.periods as period (period.id)}
          {#if period.start_date && period.end_date}
            <div class="info-row">
              <span class="info-label">
                {display_date(new Date(period.start_date), {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: undefined,
                  minute: undefined,
                })} — {display_date(
                  new Date(period.end_date),
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: undefined,
                    minute: undefined,
                  },
                )}
              </span>
              <span>${period.price}</span>
            </div>
          {/if}
        {/each}
      </div>
    </Content.Section>
  {/if}
{/snippet}

{@render ContractInfo()}
{@render Manager()}
{@render RentPrice()}
{@render RentPeriods()}

<style>
  .info-list {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .info-row {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .info-label {
    font-weight: 500;
    min-width: 120px;
  }
</style>

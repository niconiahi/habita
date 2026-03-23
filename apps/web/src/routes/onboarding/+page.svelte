<script lang="ts">
  import * as Content from "$lib/components/Content"
  import * as Formulary from "$lib/components/Formulary"
  import { compose_action } from "$lib/compose_action"
  import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
  import { ACTION } from "./actions/action"
</script>

{#snippet FreelanceCard()}
  <Content.Section>
    <Formulary.Root
      action={compose_action(ACTION.SELECT_ACCOUNT_TYPE)}
      method="POST"
    >
      <input
        type="hidden"
        name="type"
        value={SUBSCRIPTION_TYPE.FREELANCE}
      />
      <button class="card" type="submit">
        <h3 class="card-title">Freelance</h3>
        <p class="card-description">
          Gestioná propiedades de forma independiente
        </p>
      </button>
    </Formulary.Root>
  </Content.Section>
{/snippet}

{#snippet RealtorCard()}
  <Content.Section>
    <Formulary.Root
      action={compose_action(ACTION.SELECT_ACCOUNT_TYPE)}
      method="POST"
    >
      <input
        type="hidden"
        name="type"
        value={SUBSCRIPTION_TYPE.REALTOR}
      />
      <button class="card" type="submit">
        <h3 class="card-title">Inmobiliaria</h3>
        <p class="card-description">
          Gestioná propiedades como inmobiliaria con tu equipo
        </p>
      </button>
    </Formulary.Root>
  </Content.Section>
{/snippet}

<Content.Root>
  <Content.Title>Elegí tu tipo de cuenta</Content.Title>
  {@render FreelanceCard()}
  {@render RealtorCard()}
</Content.Root>

<style>
  .card {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
    padding: var(--spacing-6);
    border: 2px solid var(--gray-400);
    background-color: var(--gray-700);
    border-radius: 0.25rem;
    cursor: pointer;
    text-align: left;
    transition: border-color 0.15s ease;
    color: var(--gray-100);
  }
  .card:hover {
    border-color: var(--accent);
  }
  .card-title {
    font-size: var(--spacing-6);
  }
  .card-description {
    color: var(--gray-300);
  }
</style>

<script lang="ts">
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
</script>

<Content.Root>
  <Content.Title>Pago de prueba</Content.Title>
  <Content.Section>
    <p class="description">
      Realiza un pago de prueba de 50 ARS a través de
      Mercado Pago.
    </p>
    <form
      method="POST"
      action={compose_action(ACTION.CREATE_PAYMENT)}
    >
      <Button variant="primary" type="submit"
        >Pagar 50 ARS</Button
      >
    </form>
  </Content.Section>
</Content.Root>

<style>
  .description {
    margin-bottom: 1rem;
  }
</style>

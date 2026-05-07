<script lang="ts">
  import * as Card from "$lib/components/Card"
  import * as Content from "$lib/components/Content"
  import Button from "$lib/components/Button.svelte"
</script>

<Content.Root>
  <Content.Title>Pago confirmado</Content.Title>
  <Content.Section>
    <Card.Root>
      <Card.Title>Suscripción renovada</Card.Title>
      <Card.Content>
        Tu suscripción fue renovada exitosamente. Ya podés
        continuar usando Habita.
      </Card.Content>
      <Card.Actions>
        <Card.Action>
          <a href="/subscriptions">
            <Button variant="primary">Ir al panel</Button>
          </a>
        </Card.Action>
      </Card.Actions>
    </Card.Root>
  </Content.Section>
</Content.Root>

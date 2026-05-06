<script lang="ts">
  import { enhance } from "$app/forms"
  import Button from "$lib/components/Button.svelte"
  import * as Content from "$lib/components/Content"
  import * as Section from "$lib/components/Section"
  import * as Table from "$lib/components/Table"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "./actions/action"
  import type { ActionData, PageData } from "./$types"

  let {
    data,
    form,
  }: { data: PageData; form: ActionData } = $props()

  function display_name(user: {
    name: string | null
    surname: string | null
    email: string
  }) {
    const composed = [user.name, user.surname]
      .filter(Boolean)
      .join(" ")
    return composed || user.email
  }
</script>

<Content.Root>
  <Content.Title>{display_name(data.member)}</Content.Title>

  <Content.Section>
    <Section.Header>
      <Section.Title>Detalles</Section.Title>
    </Section.Header>
    <dl class="details">
      <div>
        <dt>Email</dt>
        <dd>{data.member.email}</dd>
      </div>
      <div>
        <dt>Equipo</dt>
        <dd>
          <a class="link" href="/admin/teams/{data.team.id}"
            >{data.team.name}</a
          >
        </dd>
      </div>
    </dl>
  </Content.Section>

  <Content.Section>
    <Section.Header>
      <Section.Title>Propiedades gestionadas</Section.Title>
    </Section.Header>
    {#if data.properties.length === 0}
      <p class="empty-state">
        Este miembro no esta gestionando ninguna propiedad.
      </p>
    {:else}
      <Table.Root>
        <Table.Header>
          <Table.Cell header>Direccion</Table.Cell>
          <Table.Cell header>Unidad</Table.Cell>
          <Table.Cell header>Reasignar</Table.Cell>
        </Table.Header>
        <Table.Body>
          {#each data.properties as property (property.id)}
            <Table.Row>
              <Table.Cell>{property.address}</Table.Cell>
              <Table.Cell
                >{property.unit ?? "-"}</Table.Cell
              >
              <Table.Cell>
                <form
                  method="POST"
                  action={compose_action(
                    ACTION.REASSIGN_PROPERTY,
                  )}
                  use:enhance
                  class="reassign-form"
                >
                  <input
                    type="hidden"
                    name="property_id"
                    value={property.id}
                  />
                  <select name="new_manager_id">
                    <option value=""
                      >Sin gestor</option
                    >
                    {#each data.peers as peer (peer.id)}
                      <option value={peer.id}
                        >{display_name(peer)}</option
                      >
                    {/each}
                  </select>
                  <Button variant="secondary" type="submit"
                    >Reasignar</Button
                  >
                </form>
              </Table.Cell>
            </Table.Row>
          {/each}
        </Table.Body>
      </Table.Root>
    {/if}
    {#if form?.message}
      <p class="form-message">{form.message}</p>
    {/if}
  </Content.Section>
</Content.Root>

<style>
  .details {
    display: grid;
    gap: var(--dimension-spacing-2);
  }

  .details > div {
    display: flex;
    gap: var(--dimension-spacing-3);
  }

  .details dt {
    color: var(--color-text-body);
    font-weight: 600;
  }

  .empty-state {
    color: var(--color-text-body);
    font-style: italic;
  }

  .form-message {
    color: var(--color-text-error);
  }

  .link {
    color: var(--color-text-link);
  }

  .reassign-form {
    display: flex;
    gap: var(--dimension-spacing-2);
    align-items: center;
  }
</style>

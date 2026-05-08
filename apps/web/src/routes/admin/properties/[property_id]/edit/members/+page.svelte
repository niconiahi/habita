<script lang="ts">
  import * as Dialog from "$lib/components/Dialog"
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import { display_name } from "$lib/display_name"
  import {
    get_access_label,
    ACCESS_TYPE,
  } from "$lib/access_type"
  import { compose_action } from "$lib/compose_action"
  import WhatsappButton from "$lib/components/WhatsappButton.svelte"
  import { ACTION } from "../actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  let invite_dialog: HTMLDialogElement | undefined =
    $state()

  const has_landlord = $derived(
    data.property.members.some(
      (member) => member.type === ACCESS_TYPE.LANDLORD,
    ),
  )

  function handle_open_invite() {
    invite_dialog?.showModal()
  }
</script>

<section id="members">
  <h2 class="heading-sm tab-title">Miembros</h2>
  <ul class="member-list">
    {#each data.property.members as member, index (`member-${member.id}-${index}`)}
      <li class="member-item">
        {#if member.image}
          <img
            class="avatar"
            src={member.image}
            alt={display_name(member)}
          />
        {:else}
          <span class="avatar-placeholder">
            {member.name.charAt(0).toUpperCase()}
          </span>
        {/if}
        <span class="body-md-medium member-name">
          {display_name(member)}
        </span>
        <span class="body-md-medium role">
          {get_access_label(member.type)}
        </span>
        {#if member.phone_number}
          <WhatsappButton
            phone_number={member.phone_number}
          >
            Contactar
          </WhatsappButton>
        {/if}
      </li>
    {/each}
  </ul>
  {#if !has_landlord}
    <Button
      variant="primary"
      type="button"
      onclick={handle_open_invite}
    >
      Invitar dueño
    </Button>
  {/if}
</section>

{#if !has_landlord}
  <Dialog.Root bind:element={invite_dialog}>
    {#snippet children({ close })}
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Invitar dueño</Dialog.Title>
          <Dialog.Close onclick={close} />
        </Dialog.Header>
        <Formulary.Root
          method="POST"
          action={compose_action(ACTION.INVITE_LANDLORD)}
        >
          {#snippet children({ submit_state })}
            <Formulary.Fields>
              <Formulary.Field>
                <Formulary.Label for="email"
                  >email</Formulary.Label
                >
                <input
                  id="email"
                  name="email"
                  type="email"
                />
              </Formulary.Field>
            </Formulary.Fields>
            <Formulary.Actions>
              <Button
                variant="primary"
                type="submit"
                disabled={submit_state === "busy"}
              >
                <Formulary.SubmitLabel
                  state={submit_state}
                  idle="Invitar dueño"
                  busy="Invitando dueño..."
                done="Invitado"
                error="No se pudo invitar"
                />
              </Button>
            </Formulary.Actions>
          {/snippet}
        </Formulary.Root>
      </Dialog.Content>
    {/snippet}
  </Dialog.Root>
{/if}

<style>
  .tab-title {
    color: var(--color-text-heading);
  }

  .member-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .member-item {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-3);
  }

  .member-name {
    color: var(--color-text-heading);
  }

  .avatar {
    width: 2rem;
    height: 2rem;
    border-radius: var(--dimension-radius-full);
    object-fit: cover;
  }

  .avatar-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border-radius: var(--dimension-radius-full);
    background-color: var(--color-neutrals-200);
    color: var(--color-neutrals-500);
    font-weight: 600;
    font-size: 0.875rem;
  }

  .role {
    color: var(--color-text-body);
  }
</style>

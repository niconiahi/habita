<script lang="ts">
  import * as Formulary from "$lib/components/Formulary"
  import Button from "$lib/components/Button.svelte"
  import { display_name } from "$lib/display_name"
  import {
    get_access_label,
    ACCESS_TYPE,
  } from "$lib/access_type"
  import { compose_action } from "$lib/compose_action"
  import { ACTION } from "../actions/action"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  const has_landlord = $derived(
    data.property.members.some(
      (member) => member.type === ACCESS_TYPE.LANDLORD,
    ),
  )
</script>

<section id="members">
  <h2 class="heading-sm tab-title">Miembros</h2>
  <ul class="member-list">
    {#each data.property.members as member, index (`member-${member.id}-${index}`)}
      <li class="member-item">
        <p>{display_name(member)}</p>
        <p>{get_access_label(member.type)}</p>
      </li>
    {/each}
  </ul>
  {#if !has_landlord}
    <Formulary.Root
      method="POST"
      action={compose_action(ACTION.INVITE_LANDLORD)}
    >
      <Formulary.Fields>
        <Formulary.Field>
          <Formulary.Label for="email"
            >email</Formulary.Label
          >
          <input id="email" name="email" type="email" />
        </Formulary.Field>
      </Formulary.Fields>
      <Formulary.Actions>
        <Button variant="primary" type="submit"
          >Invitar dueño</Button
        >
      </Formulary.Actions>
    </Formulary.Root>
  {/if}
</section>

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
    gap: 1rem;
  }
</style>

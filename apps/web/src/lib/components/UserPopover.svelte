<script lang="ts">
  import { authClient } from "$lib/auth-client"
  import * as Popover from "$lib/components/Popover"
  import ChevronDown from "$icon/ChevronDown.svelte"

  interface Props {
    id: string
    user: {
      name: string | null
      email: string
      surname: string | null
      image: string | null
    }
    position?: "bottom" | "right"
  }

  let { id, user, position = "bottom" }: Props = $props()
</script>

<Popover.Root {id}>
  <Popover.Trigger {id}>
    {#if user.image}
      <img
        class="avatar"
        src={user.image}
        alt={user.name ?? user.email}
      />
    {/if}
    <span class="body-md-medium email">
      {user.email}
    </span>
    <ChevronDown />
  </Popover.Trigger>
  <Popover.Content {id} {position}>
    {#snippet children({ close })}
      <a
        href="/account"
        class="body-md-medium item"
        onclick={close}
      >
        Perfil
      </a>
      <a
        href="/accesses"
        class="body-md-medium item"
        onclick={close}
      >
        Accesos
      </a>
      <button
        type="button"
        class="body-md-medium item"
        onclick={async () => {
          close()
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                window.location.href = "/"
              },
            },
          })
        }}
      >
        Cerrar sesión
      </button>
    {/snippet}
  </Popover.Content>
</Popover.Root>

<style>
  .avatar {
    width: var(--avatar-size-sm);
    height: var(--avatar-size-sm);
    border-radius: var(--dimension-radius-full);
    object-fit: cover;
  }

  .item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--dimension-spacing-3);
    border: none;
    border-radius: var(--dimension-radius-default);
    background-color: transparent;
    cursor: pointer;
    color: var(--color-text-body);
    transition: background-color 0.15s ease;
  }

  .item:hover {
    background-color: var(--popover-bg-hover);
  }
</style>

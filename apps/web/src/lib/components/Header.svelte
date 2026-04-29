<script lang="ts">
  import { authClient } from "$lib/auth-client"
  import Notifications from "$lib/components/Notifications.svelte"
  import * as Popover from "$lib/components/Popover"
  import HabitaFull from "$icon/habita/Full.svelte"
  import ChevronDown from "$icon/ChevronDown.svelte"

  interface Props {
    is_manager: boolean
    user: {
      name: string | null
      email: string
      surname: string | null
      image: string | null
    } | null
  }

  let { is_manager, user }: Props = $props()
</script>

<header>
  <div class="container">
    <a href="/" class="logo" aria-label="hábita">
      <HabitaFull />
    </a>
    <nav>
      {#if user}
        <Popover.Root id="user-popover">
          <Popover.Trigger id="user-popover">
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
          <Popover.Content id="user-popover">
            {#snippet children({ close })}
              <a
                href="/profile"
                class="body-md-medium dropdown-item"
                onclick={close}
              >
                Perfil
              </a>
              <a
                href="/accesses"
                class="body-md-medium dropdown-item"
                onclick={close}
              >
                Accesos
              </a>
              <button
                type="button"
                class="body-md-medium dropdown-item"
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
      {:else}
        <a
          class="button body-md-bold secondary"
          href="/login">Login</a
        >
      {/if}
      {#if is_manager}
        <Notifications />
      {/if}
    </nav>
  </div>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: var(--dimension-spacing-2);
    background-color: var(--color-neutrals-50);
  }

  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: var(--dimension-screen-lg);
  }

  .logo {
    text-decoration: none;
    border-radius: var(--dimension-radius-lg);
  }

  nav {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-2-5);
  }

  .avatar {
    width: var(--avatar-size-sm);
    height: var(--avatar-size-sm);
    border-radius: var(--dimension-radius-full);
    object-fit: cover;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--dimension-spacing-3);
    border: none;
    border-radius: var(--dimension-radius-default);
    background-color: transparent;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .dropdown-item:hover {
    background-color: var(--popover-bg-hover);
  }
</style>

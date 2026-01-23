<script lang="ts">
  import { authClient } from "$lib/auth-client"
  import Button from "$lib/components/Button.svelte"
  import Notifications from "$lib/components/Notifications.svelte"
  import type { Notification } from "$lib/fetchers/notifications.server"

  interface Props {
    notifications: Notification[]
    is_administrator: boolean
  }

  let { notifications, is_administrator }: Props = $props()

  const session = authClient.useSession()
</script>

<header>
  <nav>
    {#if $session.data}
      <span class="email">{$session.data.user.email}</span>
      <Button
        onclick={async () => {
          await authClient.signOut({
            fetchOptions: {
              onSuccess: () => {
                window.location.href = "/"
              },
            },
          })
        }}
      >
        Logout
      </Button>
      <a
        class="button"
        aria-label="Profile page"
        href="/profile">Profile</a
      >
    {:else}
      <Button
        onclick={async () => {
          await authClient.signIn.social({
            provider: "google",
            callbackURL: "/properties",
          })
        }}
      >
        Login
      </Button>
    {/if}
    {#if is_administrator}
      <Notifications {notifications} />
    {/if}
  </nav>
</header>

<style>
  header {
    position: sticky;
    top: 0;
    z-index: 10;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    padding: var(--spacing-4);
    height: var(--header-height);
    background-color: var(--gray-700);
  }

  nav {
    display: flex;
    align-items: center;
    gap: var(--spacing-4);
  }

  .email {
    color: var(--gray-100);
    font-size: 0.875rem;
  }
</style>

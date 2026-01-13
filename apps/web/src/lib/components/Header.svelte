<script lang="ts">
  import { ACCESS_TYPE } from "$lib/access_type"
  import Button from "$lib/components/Button.svelte"
  import Notifications from "$lib/components/Notifications.svelte"
  import type { Notification } from "$lib/fetchers/notifications.server"

  interface Props {
    user: {
      id: number
      email: string
      accesses: Array<{
        id: number
        type: number
        property_id: number
      }>
    } | null
    notifications: Notification[]
  }

  let { user, notifications }: Props = $props()

  let is_administrator = $derived(
    user?.accesses.some(
      (a) => a.type === ACCESS_TYPE.ADMINISTRATOR,
    ) ?? false,
  )
</script>

<header>
  <nav>
    {#if user}
      <span class="email">{user.email}</span>
      <form method="POST" action="/auth/logout">
        <Button type="submit">Logout</Button>
      </form>
    {:else}
      <form method="POST" action="/auth/google">
        <Button type="submit">Login</Button>
      </form>
    {/if}
    <a
      class="button"
      aria-label="Profile page"
      href="/profile">Profile</a
    >
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

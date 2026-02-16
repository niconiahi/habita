<script lang="ts">
  import { authClient } from "$lib/auth-client"
  import Button from "$lib/components/Button.svelte"
  import Notifications from "$lib/components/Notifications.svelte"
  import OrganizationSelector from "$lib/components/OrganizationSelector.svelte"
  import type { Notification } from "$lib/fetchers/notifications.server"
  import type { SelectableOrganization } from "$lib/server/organization"

  interface Props {
    notifications: Notification[]
    is_manager: boolean
    organizations: SelectableOrganization[]
    active_organization_id: string | null
  }

  let {
    notifications,
    is_manager,
    organizations,
    active_organization_id,
  }: Props = $props()

  const session = authClient.useSession()
</script>

<header>
  <nav>
    {#if $session.data}
      {#if organizations.length > 0}
        <OrganizationSelector
          {organizations}
          {active_organization_id}
        />
      {/if}
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
      <a class="button" href="/login">Login</a>
    {/if}
    {#if is_manager}
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

<script lang="ts">
  import * as Dashboard from "$lib/components/Dashboard"
  import OrganizationSelector from "$lib/components/OrganizationSelector.svelte"
  import Notifications from "$lib/components/Notifications.svelte"
  import type { Snippet } from "svelte"
  import type { LayoutData } from "./$types"
  import { authClient } from "$lib/auth-client"
  import * as Popover from "$lib/components/Popover"
  import HabitaFull from "$icon/habita/Full.svelte"
  import HabitaBrandmark from "$icon/habita/Brandmark.svelte"
  import ChevronDown from "$icon/ChevronDown.svelte"

  let {
    children,
    data,
  }: { children: Snippet; data: LayoutData } = $props()

  const session = authClient.useSession()
</script>

<div class="root">
  <aside class="sidebar">
    <div class="top">
      <a href="/admin" class="sidebar-logo">
        <HabitaFull />
      </a>
      <Dashboard.Root label="Admin navigation">
        <Dashboard.Section>
          <Dashboard.Link href="/admin/properties">
            Propiedades
          </Dashboard.Link>
        </Dashboard.Section>
      </Dashboard.Root>
    </div>
    <div class="bottom">
      <div class="row">
        <OrganizationSelector
          organizations={data.organizations}
          active_organization_id={data.active_organization_id}
          position="right"
        />
        <Notifications position="right" />
      </div>
      {#if $session.data}
        <Popover.Root id="admin-user-popover">
          <Popover.Trigger id="admin-user-popover">
            <span class="avatar">
              <HabitaBrandmark />
            </span>
            <span class="email">
              {$session.data.user.email}
            </span>
            <ChevronDown />
          </Popover.Trigger>
          <Popover.Content
            id="admin-user-popover"
            position="right"
          >
            {#snippet children({ close })}
            <a href="/profile" class="dropdown-item" onclick={close}>
              Perfil
            </a>
            <button
              type="button"
              class="dropdown-item"
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
      {/if}
    </div>
  </aside>
  <main class="content">
    {@render children()}
  </main>
</div>

<style>
  .root {
    display: grid;
    grid-template-columns: auto 1fr;
    height: 100vh;
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--dimension-spacing-4);
    border-right: 1px solid var(--color-border-primary);
    background-color: var(--color-neutrals-50);
  }

  .top {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-6);
  }

  .sidebar-logo {
    display: flex;
    padding: var(--dimension-spacing-2);
  }

  .bottom {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-3);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-2);
  }

  .row :global(> :first-child) {
    flex: 1;
  }

  .avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: var(--avatar-size-sm);
    height: var(--avatar-size-sm);
    border-radius: var(--dimension-radius-full);
    overflow: hidden;
  }

  .email {
    font-family: var(--font-family-body);
    font-weight: 500;
    font-size: var(--font-size-body-md);
    line-height: 1.4;
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    width: 100%;
    padding: var(--dimension-spacing-3);
    border: none;
    border-radius: var(--dimension-radius-default);
    background-color: transparent;
    font-family: var(--font-family-body);
    font-size: var(--font-size-body-md);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .dropdown-item:hover {
    background-color: var(--popover-bg-hover);
  }

  .content {
    overflow-y: auto;
    padding: var(--dimension-spacing-4);
  }
</style>

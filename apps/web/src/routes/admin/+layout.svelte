<script lang="ts">
  import * as Dashboard from "$lib/components/Dashboard"
  import * as AssistantWidget from "$lib/components/AssistantWidget"
  import OrganizationSelector from "$lib/components/OrganizationSelector.svelte"
  import Notifications from "$lib/components/Notifications.svelte"
  import UserPopover from "$lib/components/UserPopover.svelte"
  import type { Snippet } from "svelte"
  import type { LayoutData } from "./$types"
  import HabitaFull from "$icon/habita/Full.svelte"

  let {
    children,
    data,
  }: { children: Snippet; data: LayoutData } = $props()
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
          {#if data.is_realtor}
            <Dashboard.Link href="/admin/teams">
              Equipos
            </Dashboard.Link>
          {/if}
          {#if data.is_webmaster}
            <Dashboard.Link href="/admin/conversations">
              Conversaciones
            </Dashboard.Link>
          {/if}
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
      {#if data.user}
        <UserPopover
          id="admin-user-popover"
          user={data.user}
          position="right"
        />
      {/if}
    </div>
  </aside>
  <div class="main-area">
    <main class="content">
      {@render children()}
    </main>
    <AssistantWidget.Root is_authenticated={true} />
  </div>
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

  .main-area {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    padding: var(--dimension-spacing-4);
  }
</style>

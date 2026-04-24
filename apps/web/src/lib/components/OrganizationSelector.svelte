<script lang="ts">
  import { authClient } from "$lib/auth-client"
  import { invalidateAll } from "$app/navigation"
  import * as Popover from "$lib/components/Popover"
  import ChevronDown from "$icon/ChevronDown.svelte"
  import type { SelectableOrganization } from "$lib/server/organization"

  interface Props {
    organizations: SelectableOrganization[]
    active_organization_id: string | null
    position?: "bottom" | "right" | "top"
  }

  let {
    organizations,
    active_organization_id,
    position = "bottom",
  }: Props = $props()

  const active_label = $derived(
    active_organization_id === null
      ? "Personal"
      : (organizations.find(
          (organization) =>
            organization.id === active_organization_id,
        )?.name ?? "Personal"),
  )

  async function handle_select(
    organization_id: string | null,
    close: () => void,
  ) {
    close()
    if (active_organization_id === organization_id) {
      return
    }
    await authClient.organization.setActive({
      organizationId: organization_id,
    })
    await invalidateAll()
  }
</script>

<Popover.Root id="organization-selector">
  <Popover.Trigger id="organization-selector">
    <span class="body-md-medium label">{active_label}</span>
    <ChevronDown />
  </Popover.Trigger>
  <Popover.Content id="organization-selector" {position}>
    {#snippet children({ close })}
      <div class="list">
        <button
          type="button"
          class="body-md-medium item"
          class:active={active_organization_id === null}
          onclick={() => handle_select(null, close)}
        >
          <span>Personal</span>
        </button>
        {#each organizations as organization (organization.id)}
          <button
            type="button"
            class="body-md-medium item"
            class:active={organization.id ===
              active_organization_id}
            onclick={() =>
              handle_select(organization.id, close)}
          >
            {#if organization.logo}
              <img
                src={organization.logo}
                alt=""
                class="logo"
              />
            {/if}
            <span>{organization.name}</span>
          </button>
        {/each}
      </div>
    {/snippet}
  </Popover.Content>
</Popover.Root>

<style>
  .label {
    flex: 1;
    text-align: left;
  }

  .list {
    min-width: 14rem;
    max-height: 24rem;
    overflow-y: auto;
  }

  .item {
    display: flex;
    align-items: center;
    gap: var(--dimension-spacing-2);
    width: 100%;
    padding: var(--dimension-spacing-3);
    border: none;
    border-radius: var(--dimension-radius-default);
    background-color: transparent;
    color: var(--color-text-body);
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  .item:hover {
    background-color: var(--popover-bg-hover);
  }

  .item.active {
    border: 1px solid var(--color-blue-500);
  }

  .logo {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: var(--dimension-radius-full);
    object-fit: cover;
  }
</style>

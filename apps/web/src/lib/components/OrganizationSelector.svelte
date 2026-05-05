<script lang="ts">
  import { authClient } from "$lib/auth-client"
  import { goto, invalidateAll } from "$app/navigation"
  import * as Popover from "$lib/components/Popover"
  import ChevronDown from "$icon/ChevronDown.svelte"
  import { SUBSCRIPTION_TYPE } from "$lib/subscription_type"
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

  const freelance_organization = $derived(
    organizations.find(
      (organization) =>
        organization.subscription_type ===
        SUBSCRIPTION_TYPE.FREELANCE,
    ),
  )

  const non_freelance_organizations = $derived(
    organizations.filter(
      (organization) =>
        organization.subscription_type !==
        SUBSCRIPTION_TYPE.FREELANCE,
    ),
  )

  const is_freelance_active = $derived(
    freelance_organization?.id === active_organization_id,
  )

  const active_label = $derived(
    is_freelance_active || active_organization_id === null
      ? "Personal"
      : (non_freelance_organizations.find(
          (organization) =>
            organization.id === active_organization_id,
        )?.name ?? "Personal"),
  )

  async function handle_select(
    organization: SelectableOrganization | null,
    close: () => void,
  ) {
    close()
    const organization_id = organization?.id ?? null
    if (active_organization_id === organization_id) {
      return
    }
    await authClient.organization.setActive({
      organizationId: organization_id,
    })
    if (
      organization?.subscription_type ===
      SUBSCRIPTION_TYPE.FREELANCE
    ) {
      await goto("/admin/properties", { invalidateAll: true })
    } else {
      await invalidateAll()
    }
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
          class:active={is_freelance_active ||
            active_organization_id === null}
          onclick={() =>
            handle_select(
              freelance_organization ?? null,
              close,
            )}
        >
          <span>Personal</span>
        </button>
        {#each non_freelance_organizations as organization (organization.id)}
          <button
            type="button"
            class="body-md-medium item"
            class:active={organization.id ===
              active_organization_id}
            onclick={() =>
              handle_select(organization, close)}
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

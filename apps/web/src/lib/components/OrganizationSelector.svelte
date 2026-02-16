<script lang="ts">
  import { authClient } from "$lib/auth-client"
  import { invalidateAll } from "$app/navigation"
  import type { SelectableOrganization } from "$lib/server/organization"

  interface Props {
    organizations: SelectableOrganization[]
    active_organization_id: string | null
  }

  let { organizations, active_organization_id }: Props =
    $props()

  let is_open = $state(false)

  const id = "organization-selector"
  const list_id = `${id}_listbox`

  const active_label = $derived(
    active_organization_id === null
      ? "Personal"
      : (organizations.find(
          (org) => org.id === active_organization_id,
        )?.name ?? "Personal"),
  )

  function toggle() {
    is_open = !is_open
  }

  function handle_click_outside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest(".organization-selector")) {
      is_open = false
    }
  }

  async function handle_select(
    organization_id: string | null,
  ) {
    if (active_organization_id === organization_id) {
      is_open = false
      return
    }
    await authClient.organization.setActive({
      organizationId: organization_id,
    })
    is_open = false
    await invalidateAll()
  }
</script>

<svelte:window onclick={handle_click_outside} />

<div class="organization-selector">
  <button
    type="button"
    aria-haspopup="listbox"
    aria-controls={list_id}
    aria-expanded={is_open}
    onclick={toggle}
  >
    {active_label}
  </button>
  {#if is_open}
    <ul
      role="listbox"
      id={list_id}
      class="organization-selector__list"
    >
      <li
        role="option"
        aria-selected={active_organization_id === null}
      >
        <button
          type="button"
          class="organization-selector__item"
          class:organization-selector__item--active={active_organization_id ===
            null}
          onclick={() => handle_select(null)}
        >
          <span>Personal</span>
        </button>
      </li>
      {#each organizations as org (org.id)}
        <li
          role="option"
          aria-selected={org.id === active_organization_id}
        >
          <button
            type="button"
            class="organization-selector__item"
            class:organization-selector__item--active={org.id ===
              active_organization_id}
            onclick={() => handle_select(org.id)}
          >
            {#if org.logo}
              <img
                src={org.logo}
                alt=""
                class="organization-selector__logo"
              />
            {/if}
            <span>{org.name}</span>
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .organization-selector {
    position: relative;
  }

  button {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-2) var(--spacing-3);
    background-color: transparent;
    border: 1px solid var(--gray-400);
    border-radius: var(--spacing-1);
    color: var(--gray-100);
    font-size: 0.875rem;
    cursor: pointer;
    transition: background-color 0.15s ease;
  }

  button:hover {
    background-color: var(--gray-600);
  }

  .organization-selector__list {
    position: absolute;
    top: calc(100% + var(--spacing-2));
    left: 0;
    z-index: 20;
    min-width: 14rem;
    max-height: 24rem;
    overflow-y: auto;
    margin: 0;
    padding: var(--spacing-2);
    background-color: var(--gray-700);
    border: 1px solid var(--gray-400);
    border-radius: var(--spacing-2);
    list-style: none;
  }

  .organization-selector__item {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    width: 100%;
    padding: var(--spacing-3);
    border: none;
    border-radius: var(--spacing-1);
    text-decoration: none;
    color: var(--gray-100);
    transition: background-color 0.15s ease;
  }

  .organization-selector__item:hover {
    background-color: var(--gray-600);
  }

  .organization-selector__item--active {
    border-color: var(--accent);
    border: 1px solid var(--accent);
  }

  .organization-selector__logo {
    width: 1.25rem;
    height: 1.25rem;
    border-radius: 50%;
    object-fit: cover;
  }
</style>

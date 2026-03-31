<script lang="ts">
  import { onMount } from "svelte"
  import { formatDistanceToNow } from "date-fns"
  import { es } from "date-fns/locale"
  import { get_notification_type_label } from "$lib/notification_type"
  import {
    NotificationsSchema,
    type Notification,
  } from "$lib/fetchers/notifications.schemas"
  import * as v from "valibot"

  let notifications = $state<Notification[]>([])
  let is_open = $state(false)

  const id = "notifications"
  const list_id = `${id}_listbox`

  async function fetch_and_update() {
    const response = await fetch("/api/notifications")
    const data = await response.json()
    notifications = v.parse(NotificationsSchema, data)
  }

  onMount(() => {
    fetch_and_update()

    const event_source = new EventSource(
      "/api/notifications/stream",
    )
    event_source.onmessage = () => {
      fetch_and_update()
    }
    return () => {
      event_source.close()
    }
  })

  function toggle() {
    is_open = !is_open
  }

  function handle_click_outside(event: MouseEvent) {
    const target = event.target as HTMLElement
    if (!target.closest(".notifications")) {
      is_open = false
    }
  }
</script>

<svelte:window onclick={handle_click_outside} />

<div class="notifications">
  <button
    type="button"
    aria-haspopup="listbox"
    aria-controls={list_id}
    aria-expanded={is_open}
    onclick={toggle}
  >
    Notificaciones
    {#if notifications.length > 0}
      <span class="notifications__badge"
        >{notifications.length}</span
      >
    {/if}
  </button>
  {#if is_open && notifications.length > 0}
    <ul
      role="listbox"
      id={list_id}
      class="notifications__list"
    >
      {#each notifications as notification (notification.id)}
        <li role="option" aria-selected="false">
          <a
            href={notification.href}
            class="notifications__item"
          >
            <span class="notifications__type">
              {get_notification_type_label(
                notification.type,
              )}
            </span>
            <span class="notifications__location">
              {notification.location.road}
              {notification.location.house_number}
            </span>
            <span class="notifications__time">
              {formatDistanceToNow(
                notification.created_at,
                {
                  addSuffix: true,
                  locale: es,
                },
              )}
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .notifications {
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

  .notifications__badge {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.25rem;
    height: 1.25rem;
    padding: 0 var(--spacing-1);
    background-color: var(--accent);
    border-radius: 9999px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--gray-900);
  }

  .notifications__list {
    position: absolute;
    top: calc(100% + var(--spacing-2));
    right: 0;
    z-index: 20;
    min-width: 20rem;
    max-height: 24rem;
    overflow-y: auto;
    margin: 0;
    padding: var(--spacing-2);
    background-color: var(--gray-700);
    border: 1px solid var(--gray-400);
    border-radius: var(--spacing-2);
    list-style: none;
  }

  .notifications__item {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
    padding: var(--spacing-3);
    border-radius: var(--spacing-1);
    text-decoration: none;
    color: var(--gray-100);
    transition: background-color 0.15s ease;
  }

  .notifications__item:hover {
    background-color: var(--gray-600);
  }

  .notifications__type {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .notifications__location {
    font-size: 0.8125rem;
    color: var(--gray-300);
  }

  .notifications__time {
    font-size: 0.75rem;
    color: var(--gray-300);
  }
</style>

<script lang="ts">
  import { onMount } from "svelte"
  import { formatDistanceToNow } from "date-fns"
  import { es } from "date-fns/locale"
  import { get_notification_type_label } from "$lib/notification_type"
  import {
    NotificationSchema,
    NotificationsSchema,
    type Notification,
  } from "$lib/fetchers/notifications.schemas"
  import * as v from "valibot"
  import * as Popover from "$lib/components/Popover"
  import Bell from "$icon/Bell.svelte"

  interface Props {
    position?: "bottom" | "right" | "top"
  }

  let { position = "bottom" }: Props = $props()

  let notifications = $state<Notification[]>([])
  let unread_notifications = $derived(
    notifications.filter((n) => n.read_at === null),
  )

  function mark_as_read(
    notification: Notification,
    close: () => void,
  ) {
    close()
    if (notification.read_at !== null) return
    notification.read_at = new Date().toISOString()
    fetch(`/api/notifications/${notification.id}/read`, {
      method: "POST",
    })
  }

  onMount(() => {
    fetch("/api/notifications")
      .then((response) => response.json())
      .then((data) => {
        notifications = v.parse(NotificationsSchema, data)
      })

    const event_source = new EventSource(
      "/api/notifications/stream",
    )
    event_source.onmessage = (event) => {
      const data = JSON.parse(event.data)
      const notification = v.parse(NotificationSchema, data)
      notifications = [notification, ...notifications]
    }
    return () => {
      event_source.close()
    }
  })
</script>

{#if unread_notifications.length > 0}
  <Popover.Root id="notifications">
    <Popover.Trigger id="notifications">
      <span class="bell">
        <Bell />
        <span class="badge"
          >{unread_notifications.length}</span
        >
      </span>
    </Popover.Trigger>
    <Popover.Content id="notifications" {position}>
      {#snippet children({ close })}
        <div class="list">
          {#each unread_notifications as notification (notification.id)}
            <a
              href={notification.href}
              class="item"
              onclick={() =>
                mark_as_read(notification, close)}
            >
              <span class="body-sm-medium type">
                {get_notification_type_label(
                  notification.type,
                )}
              </span>
              <span class="body-sm-medium location">
                {notification.location.road}
                {notification.location.house_number}
              </span>
              <span class="time">
                {formatDistanceToNow(
                  notification.created_at,
                  {
                    addSuffix: true,
                    locale: es,
                  },
                )}
              </span>
            </a>
          {/each}
          <a
            href="/admin/notifications"
            class="view-all body-sm-medium"
            onclick={close}
          >
            Ver todas
          </a>
        </div>
      {/snippet}
    </Popover.Content>
  </Popover.Root>
{:else}
  <Popover.Trigger
    id="notifications"
    href="/admin/notifications"
  >
    <span class="bell">
      <Bell />
    </span>
  </Popover.Trigger>
{/if}

<style>
  .bell {
    position: relative;
    display: flex;
  }

  .badge {
    position: absolute;
    top: calc(var(--dimension-spacing-1) * -3);
    right: calc(var(--dimension-spacing-1) * -3);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 1.5rem;
    height: 1.5rem;
    padding: 0 var(--dimension-spacing-1);
    background-color: var(--color-blue-500);
    border-radius: var(--dimension-radius-full);
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--color-absolute-white);
  }

  .list {
    min-width: 20rem;
    max-height: 24rem;
    overflow-y: auto;
  }

  .item {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
    padding: var(--dimension-spacing-3);
    border-radius: var(--dimension-radius-default);
    text-decoration: none;
    color: var(--color-text-body);
    transition: background-color 0.15s ease;
  }

  .item:hover {
    background-color: var(--popover-bg-hover);
  }

  .type {
    color: var(--color-text-heading);
  }

  .location {
    color: var(--color-text-body);
  }

  .time {
    font-size: 0.75rem;
    color: var(--color-neutrals-400);
  }

  .view-all {
    display: block;
    padding: var(--dimension-spacing-3);
    text-align: center;
    text-decoration: none;
    color: var(--color-blue-500);
    border-top: 1px solid var(--color-neutrals-200);
  }

  .view-all:hover {
    background-color: var(--popover-bg-hover);
  }
</style>

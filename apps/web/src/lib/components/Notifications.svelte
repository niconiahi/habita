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

<Popover.Root id="notifications">
  <Popover.Trigger id="notifications">
    <span class="bell">
      <Bell />
      {#if notifications.length > 0}
        <span class="badge">{notifications.length}</span>
      {/if}
    </span>
  </Popover.Trigger>
  <Popover.Content id="notifications" {position}>
    <div class="list">
      {#if notifications.length > 0}
        {#each notifications as notification (notification.id)}
          <a href={notification.href} class="item">
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
      {:else}
        <p class="body-sm-medium empty">Sin notificaciones</p>
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>

<style>
  .bell {
    position: relative;
    display: flex;
  }

  .badge {
    position: absolute;
    top: -10px;
    right: -10px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--dimension-spacing-1)
      var(--dimension-spacing-2);
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

  .empty {
    padding: var(--dimension-spacing-3);
    color: var(--color-text-body);
  }
</style>

<script lang="ts">
  import { format, formatDistanceToNow } from "date-fns"
  import { es } from "date-fns/locale"
  import { get_notification_type_label } from "$lib/notification_type"
  import * as Content from "$lib/components/Content"
  import type { PageData } from "./$types"

  let { data }: { data: PageData } = $props()

  const DAY_FORMAT = "EEEE d 'de' MMMM"

  const grouped_notifications = $derived(
    group_by_day(data.notifications),
  )

  function group_by_day(
    notifications: PageData["notifications"],
  ) {
    const groups: {
      label: string
      notifications: PageData["notifications"]
    }[] = []

    for (const notification of notifications) {
      const label = format(
        notification.created_at,
        DAY_FORMAT,
        {
          locale: es,
        },
      )
      const last_group = groups.at(-1)
      if (last_group?.label === label) {
        last_group.notifications.push(notification)
      } else {
        groups.push({
          label,
          notifications: [notification],
        })
      }
    }

    return groups
  }
</script>

<Content.Root label="Notificaciones">
  <Content.Title>Notificaciones</Content.Title>
  <Content.Section>
    {#if grouped_notifications.length === 0}
      <p class="body-md-medium empty">
        No tenés notificaciones
      </p>
    {:else}
      {#each grouped_notifications as group (group.label)}
        <div class="day-group">
          <h2 class="body-sm-medium day-label">
            {group.label}
          </h2>
          <ul class="notification-list">
            {#each group.notifications as notification (notification.id)}
              <li>
                <a
                  href={notification.href}
                  class="notification"
                  class:read={notification.read_at !== null}
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
              </li>
            {/each}
          </ul>
        </div>
      {/each}
    {/if}
  </Content.Section>
</Content.Root>

<style>
  .day-group {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-2);
  }

  .day-label {
    color: var(--color-neutrals-400);
    text-transform: capitalize;
    padding: var(--dimension-spacing-2) 0;
    border-bottom: 1px solid var(--color-border-primary);
  }

  .notification-list {
    display: flex;
    flex-direction: column;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .notification {
    display: flex;
    flex-direction: column;
    gap: var(--dimension-spacing-1);
    padding: var(--dimension-spacing-3);
    border-radius: var(--dimension-radius-default);
    text-decoration: none;
    color: var(--color-text-body);
    transition: background-color 0.15s ease;
  }

  .notification:hover {
    background-color: var(--color-neutrals-50);
  }

  .notification.read {
    opacity: 0.6;
  }

  .type {
    color: var(--color-text-heading);
  }

  .time {
    font-size: 0.75rem;
    color: var(--color-neutrals-400);
  }

  .empty {
    padding: var(--dimension-spacing-6);
    color: var(--color-text-body);
    text-align: center;
  }
</style>

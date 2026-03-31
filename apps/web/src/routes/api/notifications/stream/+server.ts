import { redirect } from "@sveltejs/kit"
import { ACCESS_TYPE } from "$lib/access_type"
import {
  NOTIFICATION_EVENT,
  notification_emitter,
} from "$lib/server/notification_emitter"
import { get_accessible_property_ids } from "$lib/server/property_access"
import type { RequestHandler } from "./$types"

export const GET: RequestHandler = async ({
  locals,
}) => {
  if (!locals.user) {
    redirect(302, "/login")
  }

  const property_ids = await get_accessible_property_ids(
    locals.user.id,
    [ACCESS_TYPE.MANAGER],
    locals.session?.activeOrganizationId,
  )

  let cleanup: () => void

  const readable = new ReadableStream({
    start(controller) {
      function handle_notification(notification: {
        property_id: number
      }) {
        if (
          !property_ids.includes(notification.property_id)
        ) {
          return
        }
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify(notification)}\n\n`,
          ),
        )
      }

      notification_emitter.on(
        NOTIFICATION_EVENT,
        handle_notification,
      )

      cleanup = () => {
        notification_emitter.off(
          NOTIFICATION_EVENT,
          handle_notification,
        )
      }

      controller.enqueue(
        new TextEncoder().encode(": connected\n\n"),
      )
    },
    cancel() {
      cleanup()
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}

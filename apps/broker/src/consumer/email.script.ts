import { SEND_BOOKING_CONFIRMATION_TOPIC } from "../event/send_booking_confirmation"
import { SEND_LANDLORD_INVITE_TOPIC } from "../event/send_landlord_invite"
import { SEND_RENEWAL_REMINDER_TOPIC } from "../event/send_renewal_reminder"
import { SEND_SIGNING_REQUEST_TOPIC } from "../event/send_signing_request"
import { create_consumer } from "./create_consumer"
import { handle_send_booking_confirmation } from "../handler/handle_send_booking_confirmation"
import { handle_send_landlord_invite } from "../handler/handle_send_landlord_invite"
import { handle_send_renewal_reminder } from "../handler/handle_send_renewal_reminder"
import { handle_send_signing_request } from "../handler/handle_send_signing_request"

create_consumer({
  client_id: "email",
  group_id: "email",
  handlers: {
    [SEND_BOOKING_CONFIRMATION_TOPIC]:
      handle_send_booking_confirmation,
    [SEND_SIGNING_REQUEST_TOPIC]:
      handle_send_signing_request,
    [SEND_LANDLORD_INVITE_TOPIC]:
      handle_send_landlord_invite,
    [SEND_RENEWAL_REMINDER_TOPIC]:
      handle_send_renewal_reminder,
  },
})

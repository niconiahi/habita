import { SEND_BOOKING_CONFIRMATION_TOPIC } from "../event/send_booking_confirmation"
import { SEND_LANDLORD_INVITE_TOPIC } from "../event/send_landlord_invite"
import { SEND_TEAM_INVITE_TOPIC } from "../event/send_team_invite"
import { SEND_RENEWAL_REMINDER_TOPIC } from "../event/send_renewal_reminder"
import { SEND_SIGNING_REQUEST_TOPIC } from "../event/send_signing_request"
import { SEND_NO_SLOTS_ALERT_TOPIC } from "../event/send_no_slots_alert"
import { SEND_SLOT_REJECTED_ALERT_TOPIC } from "../event/send_slot_rejected_alert"
import { SEND_SLOT_RESERVED_ALERT_TOPIC } from "../event/send_slot_reserved_alert"
import { create_consumer } from "./create_consumer"
import { handle_send_booking_confirmation } from "../handler/handle_send_booking_confirmation"
import { handle_send_landlord_invite } from "../handler/handle_send_landlord_invite"
import { handle_send_team_invite } from "../handler/handle_send_team_invite"
import { handle_send_no_slots_alert } from "../handler/handle_send_no_slots_alert"
import { handle_send_renewal_reminder } from "../handler/handle_send_renewal_reminder"
import { handle_send_signing_request } from "../handler/handle_send_signing_request"
import { handle_send_slot_rejected_alert } from "../handler/handle_send_slot_rejected_alert"
import { handle_send_slot_reserved_alert } from "../handler/handle_send_slot_reserved_alert"

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
    [SEND_TEAM_INVITE_TOPIC]: handle_send_team_invite,
    [SEND_RENEWAL_REMINDER_TOPIC]:
      handle_send_renewal_reminder,
    [SEND_SLOT_RESERVED_ALERT_TOPIC]:
      handle_send_slot_reserved_alert,
    [SEND_SLOT_REJECTED_ALERT_TOPIC]:
      handle_send_slot_rejected_alert,
    [SEND_NO_SLOTS_ALERT_TOPIC]:
      handle_send_no_slots_alert,
  },
})

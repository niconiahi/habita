import { CALCULATE_ESCALATION_TOPIC } from "../event/calculate_escalation"
import { DELETE_OBJECT_TOPIC } from "../event/delete_object"
import { create_consumer } from "./create_consumer"
import { handle_calculate_escalation } from "../handler/handle_calculate_escalation"
import { handle_delete_object } from "../handler/handle_delete_object"

create_consumer({
  client_id: "escalation",
  group_id: "escalation",
  handlers: {
    [CALCULATE_ESCALATION_TOPIC]:
      handle_calculate_escalation,
    [DELETE_OBJECT_TOPIC]: handle_delete_object,
  },
})

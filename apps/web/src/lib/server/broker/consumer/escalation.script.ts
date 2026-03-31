import { CALCULATE_ESCALATION_TOPIC } from "../events/calculate_escalation"
import { DELETE_OBJECT_TOPIC } from "../events/delete_object"
import { create_consumer } from "./create_consumer"
import { handle_calculate_escalation } from "./handle_calculate_escalation"
import { handle_delete_object } from "./handle_delete_object"

create_consumer({
  client_id: "escalation",
  group_id: "escalation",
  handlers: {
    [CALCULATE_ESCALATION_TOPIC]:
      handle_calculate_escalation,
    [DELETE_OBJECT_TOPIC]: handle_delete_object,
  },
})

import { CALCULATE_ESCALATION_TOPIC } from "../events/calculate_escalation"
import { create_consumer } from "./create_consumer"
import { handle_calculate_escalation } from "./handle_calculate_escalation"

create_consumer({
  client_id: "escalation",
  group_id: "escalation",
  handlers: {
    [CALCULATE_ESCALATION_TOPIC]:
      handle_calculate_escalation,
  },
})

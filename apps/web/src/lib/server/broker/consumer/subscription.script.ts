import { EXTEND_SUBSCRIPTION_TOPIC } from "../events/extend_subscription"
import { create_consumer } from "./create_consumer"
import { handle_extend_subscription } from "./handle_extend_subscription"

create_consumer({
  client_id: "subscription",
  group_id: "subscription",
  handlers: {
    [EXTEND_SUBSCRIPTION_TOPIC]:
      handle_extend_subscription,
  },
})

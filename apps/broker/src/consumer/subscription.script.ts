import { EXTEND_SUBSCRIPTION_TOPIC } from "../event/extend_subscription"
import { create_consumer } from "./create_consumer"
import { handle_extend_subscription } from "../handler/handle_extend_subscription"

create_consumer({
  client_id: "subscription",
  group_id: "subscription",
  handlers: {
    [EXTEND_SUBSCRIPTION_TOPIC]:
      handle_extend_subscription,
  },
})

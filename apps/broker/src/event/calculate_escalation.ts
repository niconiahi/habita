// NOTE: this schema is duplicated in apps/{web,broker}/. Keep both in sync when changing.
import * as v from "valibot"

export const CALCULATE_ESCALATION_TOPIC =
  "calculate_escalation"

export const CalculateEscalationEvent = v.object({})

export type CalculateEscalationEvent = v.InferOutput<
  typeof CalculateEscalationEvent
>

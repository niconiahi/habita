import * as v from "valibot"
import {
  RateTypeSchema,
  get_rate_label,
} from "$lib/rate_type"
import type { Duration } from "$lib/duration"

function get_frequency_label(duration: Duration) {
  switch (duration) {
    case "P3M": {
      return "trimestral"
    }
    case "P6M": {
      return "semestral"
    }
    case "P1Y": {
      return "anual"
    }
    default: {
      return duration
    }
  }
}

export function display_escalation(
  escalation_type: number,
  escalation_duration: string,
): string | null {
  const type_validation = v.safeParse(
    RateTypeSchema,
    escalation_type,
  )
  if (!type_validation.success) {
    return null
  }
  const frequency = get_frequency_label(
    escalation_duration as Duration,
  )
  const label = get_rate_label(type_validation.output)
  return `Aumento ${frequency} por ${label}`
}

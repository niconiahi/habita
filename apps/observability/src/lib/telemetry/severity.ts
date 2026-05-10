// OTel SeverityNumber data model.
// Spec: https://opentelemetry.io/docs/specs/otel/logs/data-model/#field-severitynumber

export const SEVERITY = {
  TRACE: { min: 1, max: 4 },
  DEBUG: { min: 5, max: 8 },
  INFO: { min: 9, max: 12 },
  WARN: { min: 13, max: 16 },
  ERROR: { min: 17, max: 20 },
  FATAL: { min: 21, max: 24 },
} as const

export type SeverityLabel = keyof typeof SEVERITY

export function get_severity_label(number: number): SeverityLabel {
  for (const [label, range] of Object.entries(SEVERITY)) {
    if (number >= range.min && number <= range.max) {
      return label as SeverityLabel
    }
  }
  return "INFO"
}

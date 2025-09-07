import * as v from "valibot"

export const FormulaSchema = v.object({
  label: v.string(),
  pattern: v.string(),
})
export type Formula = v.InferOutput<typeof FormulaSchema>
export const FORMULAS: Formula[] = [
  {
    pattern:
      "price * (ipc_current_month / ipc_four_months_ago)",
    label: "IPC",
  },
]

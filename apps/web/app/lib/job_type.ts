export enum AccessRole {}
import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const JOB_TYPE = {
  CALCULATE_PRICES: 0,
} as const
export const AccessTypeSchema = v.picklist(
  Object.values(JOB_TYPE),
)
export type AccessType = ObjectValues<typeof JOB_TYPE>

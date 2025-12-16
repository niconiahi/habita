import * as v from "valibot";

export type ObjectValues<T> = T[keyof T];
export const JOB_TYPE = {
  CALCULATE_PRICES: 0
} as const;
export const JobTypeSchema = v.picklist(Object.values(JOB_TYPE));
export type JobType = ObjectValues<typeof JOB_TYPE>;

export function get_job_types() {
  return Object.values(JOB_TYPE);
}

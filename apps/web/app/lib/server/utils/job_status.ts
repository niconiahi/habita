export type ObjectValues<T> = T[keyof T]

export const JOB_STATUS = {
  PENDING: "pending",
  FULFILLED: "fulfilled",
  FAILED: "failed",
} as const

export type JobStatus = ObjectValues<typeof JOB_STATUS>

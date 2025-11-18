import * as v from "valibot"

export type ObjectValues<T> = T[keyof T]
export const JOB_STATUS = {
  PENDING: 0,
  FULFILLED: 1,
  FAILED: 2,
} as const
export const JobStatusSchema = v.picklist(
  Object.values(JOB_STATUS),
)
export type JobStatus = ObjectValues<typeof JOB_STATUS>

export function get_job_status_label(
  type: number | JobStatus,
) {
  const job_status = v.parse(JobStatusSchema, type)
  switch (job_status) {
    case JOB_STATUS.FAILED: {
      return "Fallido"
    }
    case JOB_STATUS.PENDING: {
      return "Pendiente"
    }
    case JOB_STATUS.FULFILLED: {
      return "Completado"
    }
    default: {
      const _exhaustive: never = job_status
      return _exhaustive
    }
  }
}

export function get_job_statuses() {
  return Object.values(JOB_STATUS)
}

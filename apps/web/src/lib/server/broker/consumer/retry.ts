import type { IHeaders } from "kafkajs"

export const MAX_RETRIES = 3
export const DEFAULT_RETRY_COUNT = 0
export const IDEMPOTENCY_LOCK_TTL_SECONDS = 86400

const RETRY_COUNT_HEADER = "retry-count"
const FAILURE_REASON_HEADER = "failure-reason"
export const MESSAGE_ID_HEADER = "message-id"

export function get_retry_count(
  headers: IHeaders | undefined,
): number {
  const value = headers?.[RETRY_COUNT_HEADER]
  if (!value) return DEFAULT_RETRY_COUNT
  return Number(value.toString())
}

export function with_incremented_retry(
  headers: IHeaders | undefined,
  retry_count: number,
): IHeaders {
  return {
    ...headers,
    [RETRY_COUNT_HEADER]: String(retry_count + 1),
  }
}

export function with_failure_reason(
  headers: IHeaders | undefined,
  reason: string,
): IHeaders {
  return {
    ...headers,
    [FAILURE_REASON_HEADER]: reason,
  }
}

export function get_message_id(
  headers: IHeaders | undefined,
): string | undefined {
  const value = headers?.[MESSAGE_ID_HEADER]
  if (!value) return undefined
  return value.toString()
}

export function compose_idempotency_key(
  topic: string,
  message_id: string,
): string {
  return `lock:${topic}:${message_id}`
}

import type { IHeaders } from "kafkajs"

export const MAX_RETRIES = 3
export const DEFAULT_RETRY_COUNT = 0
export const IDEMPOTENCY_LOCK_TTL_SECONDS = 86400

const RETRY_COUNT_HEADER = "retry-count"
const RETRY_AFTER_HEADER = "retry-after"
const FAILURE_REASON_HEADER = "failure-reason"
export const MESSAGE_ID_HEADER = "message-id"

export function compose_headers(
  base: IHeaders | undefined,
  patches: IHeaders[],
): IHeaders {
  return Object.assign({}, base, ...patches)
}

export function incremented_retry(
  retry_count: number,
): IHeaders {
  return {
    [RETRY_COUNT_HEADER]: String(retry_count + 1),
  }
}

export function retry_after(
  retry_count: number,
): IHeaders {
  const delay = Math.pow(2, retry_count * 2) * 1000
  return {
    [RETRY_AFTER_HEADER]: String(Date.now() + delay),
  }
}

export function failure_reason(reason: string): IHeaders {
  return {
    [FAILURE_REASON_HEADER]: reason,
  }
}

export function is_retry_pending(
  headers: IHeaders | undefined,
): boolean {
  const value = headers?.[RETRY_AFTER_HEADER]
  if (!value) return false
  return Date.now() < Number(value.toString())
}

export function get_retry_count(
  headers: IHeaders | undefined,
): number {
  const value = headers?.[RETRY_COUNT_HEADER]
  if (!value) return DEFAULT_RETRY_COUNT
  return Number(value.toString())
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

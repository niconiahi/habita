import { EventEmitter } from "node:events"
import { lazy } from "$lib/server/lazy"

export const notification_emitter = lazy<EventEmitter>(
  () => new EventEmitter(),
)

export const NOTIFICATION_EVENT = "notification"

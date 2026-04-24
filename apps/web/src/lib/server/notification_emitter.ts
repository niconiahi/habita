import { EventEmitter } from "node:events"

export const notification_emitter =
  (globalThis.__notification_emitter ??=
    new EventEmitter()) as EventEmitter

export const NOTIFICATION_EVENT = "notification"

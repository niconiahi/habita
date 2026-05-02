import * as v from "valibot"

export type MessageRole = "user" | "assistant" | "system"

export type Message = {
  role: MessageRole
  content: string
}

export const MessageSchema = v.object({
  role: v.picklist(["user", "assistant"]),
  content: v.string(),
})

export const ChatRequestSchema = v.object({
  messages: v.pipe(v.array(MessageSchema), v.minLength(1)),
})

export type StreamChunk =
  | { type: "text"; content: string }
  | { type: "done" }
  | { type: "error"; message: string }

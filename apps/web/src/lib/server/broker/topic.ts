export function dlq_topic(topic: string) {
  return `${topic}.dlq`
}

export const MESSAGE_ID_HEADER = "message-id"

import * as v from "valibot"

export const DELETE_OBJECT_TOPIC = "delete_object"

export const DeleteObjectEvent = v.object({
  key: v.string(),
})

export type DeleteObjectEvent = v.InferOutput<
  typeof DeleteObjectEvent
>

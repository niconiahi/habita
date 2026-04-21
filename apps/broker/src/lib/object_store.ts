import { safe_async } from "./safe_async"
import { logger } from "./logger"
import * as s3 from "./s3"

type ObjectValues<T> = T[keyof T]

export const OBJECT_STORE_ERROR = {
  PUT_FAILED: 0,
  GET_FAILED: 1,
  DELETE_FAILED: 2,
  NOT_FOUND: 3,
} as const

export type ObjectStoreError = {
  type: ObjectValues<typeof OBJECT_STORE_ERROR>
  error: Error
}

export async function delete_object(
  key: string,
): Promise<[ObjectStoreError, null] | [null, null]> {
  const [error] = await safe_async(s3.delete_object(key))
  if (error) {
    logger.error(error.message, { key }, error)
    return [
      {
        type: OBJECT_STORE_ERROR.DELETE_FAILED,
        error,
      },
      null,
    ]
  }
  return [null, null]
}

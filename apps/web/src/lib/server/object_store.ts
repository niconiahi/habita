import type { ObjectValues } from "$lib/compose_types"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"
import * as s3 from "./s3"

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

export async function ensure_bucket(): Promise<
  [ObjectStoreError, null] | [null, null]
> {
  const [error] = await safe_async(s3.ensure_bucket())
  if (error) {
    logger.error(error.message, {}, error)
    return [
      {
        type: OBJECT_STORE_ERROR.PUT_FAILED,
        error,
      },
      null,
    ]
  }
  return [null, null]
}

export async function put_object(
  key: string,
  content: Buffer,
  mime: string,
): Promise<[ObjectStoreError, null] | [null, null]> {
  const [error] = await safe_async(
    s3.put_object(key, content, mime),
  )
  if (error) {
    logger.error(error.message, { key }, error)
    return [
      {
        type: OBJECT_STORE_ERROR.PUT_FAILED,
        error,
      },
      null,
    ]
  }
  return [null, null]
}

export async function get_object(
  key: string,
): Promise<[ObjectStoreError, null] | [null, Buffer]> {
  const [error, buffer] = await safe_async(s3.get_object(key))
  if (error) {
    logger.error(error.message, { key }, error)
    return [
      {
        type:
          error instanceof s3.ObjectNotFoundError
            ? OBJECT_STORE_ERROR.NOT_FOUND
            : OBJECT_STORE_ERROR.GET_FAILED,
        error,
      },
      null,
    ]
  }
  return [null, buffer]
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

export async function object_exists(
  key: string,
): Promise<[ObjectStoreError, null] | [null, boolean]> {
  const [error, exists] = await safe_async(
    s3.object_exists(key),
  )
  if (error) {
    logger.error(error.message, { key }, error)
    return [
      {
        type: OBJECT_STORE_ERROR.GET_FAILED,
        error,
      },
      null,
    ]
  }
  return [null, exists]
}

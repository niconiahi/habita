import type { ObjectValues } from "$lib/compose_types"
import { logger } from "$lib/telemetry/logger"
import * as s3 from "./s3"

export const OBJECT_STORE_ERROR = {
  PUT_FAILED: 0,
  GET_FAILED: 1,
  DELETE_FAILED: 2,
  NOT_FOUND: 3,
} as const

export class ObjectStoreError extends Error {
  constructor(
    public type: ObjectValues<typeof OBJECT_STORE_ERROR>,
    cause: Error,
  ) {
    super(cause.message, { cause })
  }
}

export async function ensure_bucket(): Promise<void> {
  try {
    await s3.ensure_bucket()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, {}, error)
      throw new ObjectStoreError(
        OBJECT_STORE_ERROR.PUT_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new ObjectStoreError(
        OBJECT_STORE_ERROR.PUT_FAILED,
        new Error("unknown error"),
      )
    }
  }
}

export async function put_object(
  key: string,
  content: Buffer,
  mime: string,
): Promise<void> {
  try {
    await s3.put_object(key, content, mime)
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { key }, error)
      throw new ObjectStoreError(
        OBJECT_STORE_ERROR.PUT_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new ObjectStoreError(
        OBJECT_STORE_ERROR.PUT_FAILED,
        new Error("unknown error"),
      )
    }
  }
}

export async function get_object(
  key: string,
): Promise<Buffer> {
  try {
    return await s3.get_object(key)
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { key }, error)
      throw new ObjectStoreError(
        error instanceof s3.ObjectNotFoundError
          ? OBJECT_STORE_ERROR.NOT_FOUND
          : OBJECT_STORE_ERROR.GET_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new ObjectStoreError(
        OBJECT_STORE_ERROR.GET_FAILED,
        new Error("unknown error"),
      )
    }
  }
}

export async function delete_object(
  key: string,
): Promise<void> {
  try {
    await s3.delete_object(key)
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { key }, error)
      throw new ObjectStoreError(
        OBJECT_STORE_ERROR.DELETE_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new ObjectStoreError(
        OBJECT_STORE_ERROR.DELETE_FAILED,
        new Error("unknown error"),
      )
    }
  }
}

export async function object_exists(
  key: string,
): Promise<boolean> {
  try {
    return await s3.object_exists(key)
  } catch (error) {
    if (error instanceof Error) {
      logger.error(error.message, { key }, error)
      throw new ObjectStoreError(
        OBJECT_STORE_ERROR.GET_FAILED,
        error,
      )
    } else {
      logger.unknown(error)
      throw new ObjectStoreError(
        OBJECT_STORE_ERROR.GET_FAILED,
        new Error("unknown error"),
      )
    }
  }
}

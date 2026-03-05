import * as v from "valibot"
import { query_builder } from "db/query_builder"
import { normalize_input } from "$lib/server/form"
import { encrypt } from "$lib/server/encryption"
import { safe_async } from "$lib/safe_async"
import { logger } from "$lib/telemetry/logger"

const ArgentinePhoneSchema = v.pipe(
  v.string(),
  v.check(
    (val) => val === "" || /^\+549\d{10}$/.test(val),
    "Formato invalido. Ejemplo: +5491112345678",
  ),
)

const DocumentNumberSchema = v.pipe(
  v.string(),
  v.check(
    (val) => val === "" || /^\d+$/.test(val),
    "Debe ser un numero valido",
  ),
)
const CuilSchema = v.pipe(
  v.string(),
  v.check(
    (val) => val === "" || /^\d+$/.test(val),
    "Debe ser un numero valido",
  ),
)

const InputSchema = v.object({
  name: v.pipe(
    v.string(),
    v.minLength(1, "El nombre es requerido"),
  ),
  surname: v.pipe(
    v.string(),
    v.minLength(1, "El apellido es requerido"),
  ),
  phone_number: ArgentinePhoneSchema,
  document_number: DocumentNumberSchema,
  cuil: CuilSchema,
})

export async function update_user(
  form_data: FormData,
  user_id: number,
) {
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    return [
      {
        update_user: {
          input: v.flatten(input_validation.issues),
        },
      },
      null,
    ] as const
  }
  const input = input_validation.output

  const name = encrypt(input.name)
  const surname = encrypt(input.surname)
  const phone_number =
    input.phone_number === ""
      ? null
      : encrypt(input.phone_number)
  const document_number =
    input.document_number === ""
      ? null
      : encrypt(input.document_number)
  const cuil =
    input.cuil === "" ? null : encrypt(input.cuil)
  const [error] = await safe_async(
    query_builder
      .updateTable("user")
      .set({
        name,
        surname,
        phone_number,
        document_number,
        cuil,
        updated_at: new Date(),
      })
      .where("user.id", "=", user_id)
      .execute(),
  )
  if (error) {
    logger.error(error.message, { user_id }, error)
    return [
      {
        update_user: {
          execution: "Error al actualizar el perfil",
        },
      },
      null,
    ] as const
  }

  return [null, null] as const
}

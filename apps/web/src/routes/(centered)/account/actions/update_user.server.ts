import { fail } from "@sveltejs/kit"
import { query_builder } from "db/query_builder"
import * as v from "valibot"
import { encrypt } from "$lib/server/encryption"
import { normalize_input } from "$lib/server/form"
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
const CUIL_LENGTH = 11
const CUIL_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
const VALID_CUIL_PREFIXES = ["20", "23", "24", "27"]

const CuilSchema = v.pipe(
  v.string(),
  v.check(
    (val) => val === "" || /^\d+$/.test(val),
    "Solo se permiten numeros",
  ),
  v.check(
    (val) => val === "" || val.length === CUIL_LENGTH,
    "El CUIL debe tener 11 digitos",
  ),
  v.check(
    (val) =>
      val === "" ||
      VALID_CUIL_PREFIXES.includes(val.slice(0, 2)),
    "El prefijo debe ser 20, 23, 24 o 27",
  ),
  v.check((val) => {
    if (val === "" || val.length !== CUIL_LENGTH)
      return true
    let sum = 0
    for (let i = 0; i < 10; i++) {
      sum += Number(val[i]) * CUIL_WEIGHTS[i]
    }
    const remainder = sum % 11
    const expected =
      remainder === 0
        ? 0
        : remainder === 1
          ? 9
          : 11 - remainder
    return expected === Number(val[10])
  }, "El digito verificador es incorrecto"),
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
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
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
  try {
    await query_builder
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
      .execute()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(
        error.message,
        { user_id },
        error,
      )
    } else {
      logger.unknown(error)
    }
    return fail(400, {
      message: "Error al actualizar el perfil",
    })
  }
}

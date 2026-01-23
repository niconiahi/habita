import * as v from "valibot"
import { query_builder } from "db/query_builder"
import {
  normalize_input,
  get_errors,
} from "$lib/server/form"
import { encrypt } from "$lib/server/encryption"

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
})

async function execute(
  form_data: FormData,
  user_id: number,
) {
  const input = v.parse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
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
  await query_builder
    .updateTable("user")
    .set({
      name,
      surname,
      phone_number,
      document_number,
      updated_at: new Date(),
    })
    .where("user.id", "=", user_id)
    .execute()
}

export const update_user = {
  execute,
  get_errors: (error: v.ValiError<typeof InputSchema>) => {
    return get_errors<typeof InputSchema>(error)
  },
}

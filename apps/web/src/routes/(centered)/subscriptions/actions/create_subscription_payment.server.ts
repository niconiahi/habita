import { fail } from "@sveltejs/kit"
import * as v from "valibot"
import { normalize_input } from "$lib/server/form"
import { create_subscription_payment as create_mercado_pago_subscription_payment } from "../../subscribe/actions/create_subscription_payment.server"

const InputSchema = v.object({
  organization_id: v.pipe(v.string(), v.nonEmpty()),
})

export async function create_subscription_payment(
  form_data: FormData,
  user_subscriptions: App.Locals["subscriptions"],
) {
  console.log(
    "[subs/action] create_subscription_payment entered",
  )
  const input_validation = v.safeParse(
    InputSchema,
    normalize_input(form_data, InputSchema),
  )
  if (!input_validation.success) {
    console.log(
      "[subs/action] validation failed",
      v.flatten(input_validation.issues),
    )
    return fail(400, {
      errors: v.flatten(input_validation.issues),
    })
  }
  const { organization_id } = input_validation.output
  console.log(
    "[subs/action] organization_id from form",
    organization_id,
  )

  const owns_organization = user_subscriptions.some(
    (subscription) =>
      subscription.organization_id === organization_id,
  )
  if (!owns_organization) {
    console.log("[subs/action] ownership check FAILED", {
      organization_id,
      user_subs: user_subscriptions.map(
        (s) => s.organization_id,
      ),
    })
    return fail(400, {
      message: "No tenés acceso a esa organización",
    })
  }
  console.log(
    "[subs/action] ownership check passed, delegating to MP helper",
  )

  return create_mercado_pago_subscription_payment(
    organization_id,
  )
}

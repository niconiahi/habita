import { sql } from "kysely"
import { query_builder } from "../../../../db/query_builder"
import { SUBSCRIPTION_TYPE } from "../../subscription_type"
import { logger } from "../../telemetry/logger"
import { SendEmailError, send_email } from "../send_email"

const FREELANCE_PRICE_USD = 50
const REALTOR_SEAT_PRICE_USD = 40

export async function send_renewal_reminder() {
  const organizations = await query_builder
    .selectFrom("subscription")
    .innerJoin(
      "organization",
      "organization.id",
      "subscription.organization_id",
    )
    .select([
      "subscription.organization_id",
      "subscription.type",
      "subscription.ends_at",
      "organization.name as organization_name",
    ])
    .where(
      "subscription.ends_at",
      "<=",
      sql<Date>`now() + interval '7 days'`,
    )
    .groupBy([
      "subscription.organization_id",
      "subscription.type",
      "subscription.ends_at",
      "organization.name",
    ])
    .execute()

  for (const organization of organizations) {
    const seat_count_result = await query_builder
      .selectFrom("subscription")
      .where(
        "organization_id",
        "=",
        organization.organization_id,
      )
      .select(sql<number>`count(*)::int`.as("count"))
      .executeTakeFirst()
    const seat_count = seat_count_result?.count ?? 1

    const amount =
      organization.type === SUBSCRIPTION_TYPE.FREELANCE
        ? FREELANCE_PRICE_USD
        : seat_count * REALTOR_SEAT_PRICE_USD

    const admin = await query_builder
      .selectFrom("member")
      .innerJoin("user", "user.id", "member.user_id")
      .where(
        "member.organization_id",
        "=",
        organization.organization_id,
      )
      .where("member.role", "in", ["realtor", "manager"])
      .select(["user.email", "user.name"])
      .executeTakeFirst()

    if (!admin) {
      logger.warn("no admin found for organization", {
        organization_id: organization.organization_id,
      })
      continue
    }

    const period_end = new Date(organization.ends_at)
    const is_grace = period_end <= new Date()
    const origin =
      process.env.BETTER_AUTH_URL ?? "https://habita.rent"

    const subject = is_grace
      ? "Tu suscripción de Habita venció"
      : "Tu suscripción de Habita vence pronto"

    const html = is_grace
      ? `<p>Tu suscripción venció. Renová para evitar la interrupción del servicio.</p>
         <p>Monto: <strong>$${amount} USD</strong></p>
         <p><a href="${origin}/subscribe">Renovar ahora</a></p>`
      : `<p>Tu suscripción vence el <strong>${period_end.toLocaleDateString("es-AR")}</strong>.</p>
         <p>Monto: <strong>$${amount} USD</strong></p>
         <p><a href="${origin}/subscribe">Renovar ahora</a></p>`

    try {
      await send_email({
        to: { email: admin.email, name: admin.name ?? "" },
        subject,
        html,
      })
    } catch (error) {
      if (error instanceof SendEmailError) {
        logger.error("failed to send renewal reminder", {
          organization_id: organization.organization_id,
          email: admin.email,
        })
      } else {
        logger.unknown(error)
      }
      continue
    }

    logger.info("sent renewal reminder", {
      organization_id: organization.organization_id,
      email: admin.email,
      amount,
      is_grace,
    })
  }
}

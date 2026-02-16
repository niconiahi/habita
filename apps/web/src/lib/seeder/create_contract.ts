import { query_builder } from "../../../db/query_builder"

export async function create_contract(
  property_id: number,
  data: {
    type: number
    state: number
    start_date?: Date
    end_date?: Date
    destiny?: number
    escalation_type?: number
    escalation_duration?: string
    cbu?: string
    fine_amount?: number
    fine_type?: number
    percentage_return?: number
    early_termination?: number
    showroom_hours?: number
    court_id?: number
    default_type?: number
    default_amount?: number
    default_duration?: string
    warranty_id?: number
  },
): Promise<number> {
  const now = new Date().toISOString()
  const contract = await query_builder
    .insertInto("contract")
    .values({
      property_id,
      type: data.type,
      state: data.state,
      start_date: data.start_date,
      end_date: data.end_date,
      destiny: data.destiny,
      escalation_type: data.escalation_type,
      escalation_duration: data.escalation_duration,
      cbu: data.cbu,
      fine_amount: data.fine_amount,
      fine_type: data.fine_type,
      percentage_return: data.percentage_return,
      early_termination: data.early_termination,
      showroom_hours: data.showroom_hours,
      court_id: data.court_id,
      default_type: data.default_type,
      default_amount: data.default_amount,
      default_duration: data.default_duration,
      warranty_id: data.warranty_id,
      created_at: now,
      updated_at: now,
    })
    .returning("id")
    .executeTakeFirstOrThrow()
  console.log(`created contract with id ${contract.id}`)
  return contract.id
}

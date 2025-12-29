import type { PageServerLoad } from "./$types"

export const load: PageServerLoad = async ({ url }) => {
  const payment_id = url.searchParams.get("payment_id")
  const collection_status = url.searchParams.get(
    "collection_status",
  )
  return {
    payment_id,
    collection_status,
  }
}

export function defer_changing(
  read: () => boolean,
  ms: number,
): () => boolean {
  let started_at = $state<number | null>(null)
  let tick = $state(0)
  let timer: ReturnType<typeof setTimeout> | null = null

  $effect(() => {
    if (read() && started_at === null) {
      started_at = Date.now()
    }
  })

  $effect(() => {
    void tick
    if (started_at === null) return
    const elapsed = Date.now() - started_at
    const remaining = ms - elapsed
    if (remaining <= 0 && !read()) {
      started_at = null
      return
    }
    if (remaining > 0) {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        tick++
      }, remaining)
    }
  })

  $effect(() => () => {
    if (timer) clearTimeout(timer)
  })

  return () => {
    void tick
    if (read()) return true
    if (started_at === null) return false
    return Date.now() - started_at < ms
  }
}

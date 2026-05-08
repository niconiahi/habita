import { goto } from "$app/navigation"
import { page } from "$app/state"

export function is_disclosure_open(
  name: string,
  id: string,
): boolean {
  return page.url.searchParams.get(name) === id
}

export function handle_disclosure_toggle(
  name: string,
  id: string,
  event: Event,
): void {
  const target = event.currentTarget as HTMLDetailsElement
  const url = new URL(page.url)
  if (target.open) {
    if (url.searchParams.get(name) === id) return
    url.searchParams.set(name, id)
  } else {
    if (url.searchParams.get(name) !== id) return
    url.searchParams.delete(name)
  }
  goto(url, {
    keepFocus: true,
    replaceState: true,
    noScroll: true,
  })
}

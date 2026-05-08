import { goto } from "$app/navigation"
import { page } from "$app/state"

export function is_disclosure_open(
  name: string,
  id: string,
): boolean {
  return page.url.searchParams.get(name) === id
}

export function handle_disclosure_click(
  name: string,
  id: string,
  event: MouseEvent,
): void {
  event.preventDefault()
  const url = new URL(window.location.href)
  if (url.searchParams.get(name) === id) {
    url.searchParams.delete(name)
  } else {
    url.searchParams.set(name, id)
  }
  goto(url, {
    keepFocus: true,
    replaceState: true,
    noScroll: true,
  })
}

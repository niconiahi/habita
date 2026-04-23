import type { Action } from "svelte/action"

export const haptic: Action = function haptic(node) {
  const controller = new AbortController()
  const options = { signal: controller.signal }

  function press() {
    if (node.hasAttribute("disabled")) return
    node.classList.add("pressed")
  }

  function release() {
    node.classList.remove("pressed")
  }

  node.addEventListener("pointerdown", press, options)
  node.addEventListener("pointerup", release, options)
  node.addEventListener("pointerleave", release, options)
  node.addEventListener("touchcancel", release, options)

  return {
    destroy() {
      controller.abort()
    },
  }
}

export function haptic_global() {
  let current: HTMLElement | null = null

  function find_target(event: Event): HTMLElement | null {
    const target = event.target as HTMLElement
    return target.closest("a, button")
  }

  function press(event: Event) {
    const target = find_target(event)
    if (!target || target.hasAttribute("disabled")) return
    current = target
    target.classList.add("pressed")
  }

  function release() {
    current?.classList.remove("pressed")
    current = null
  }

  document.addEventListener("pointerdown", press)
  document.addEventListener("pointerup", release)
  document.addEventListener("pointerleave", release)
  document.addEventListener("touchcancel", release)
}

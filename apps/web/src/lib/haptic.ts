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

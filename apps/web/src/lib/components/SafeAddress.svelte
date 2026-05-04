<script lang="ts" module>
  let instance_count = 0
</script>

<script lang="ts">
  import type { Snippet } from "svelte"

  interface Props {
    house_number: number
    placement?: "top" | "bottom"
    children: Snippet
  }

  let {
    house_number,
    placement = "top",
    children,
  }: Props = $props()

  let container: HTMLElement

  const tooltip_id = `safe-address-tooltip-${instance_count++}`
  const TOOLTIP_TEXT =
    "Por seguridad, la numeración es aproximada. La dirección real se entrega una vez que el administrador acepte tu visita."

  function position_tooltip(
    trigger: HTMLElement,
    tooltip: HTMLElement,
  ) {
    const rect = trigger.getBoundingClientRect()
    tooltip.style.left = `${rect.left + rect.width / 2}px`
    if (placement === "bottom") {
      tooltip.style.top = `${rect.bottom + 8}px`
    } else {
      tooltip.style.top = `${rect.top - 8}px`
    }
  }

  $effect(() => {
    if (!container || house_number === 0) return

    const number_text = String(house_number)
    let number_node: ChildNode | null = null
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
    )
    let text_node: Text | null
    while ((text_node = walker.nextNode() as Text | null)) {
      const index = (text_node.textContent ?? "").indexOf(
        number_text,
      )
      if (index === -1) continue
      number_node = text_node.splitText(index)
      ;(number_node as Text).splitText(number_text.length)
      break
    }

    if (!number_node) return

    const trigger = document.createElement("span")
    trigger.className = "safe-address-trigger"
    trigger.setAttribute("tabindex", "0")
    trigger.setAttribute("aria-describedby", tooltip_id)
    trigger.textContent = number_text

    const tooltip = document.createElement("span")
    tooltip.id = tooltip_id
    tooltip.setAttribute("role", "tooltip")
    tooltip.className = `safe-address-tooltip safe-address-tooltip--${placement} body-sm-regular`
    tooltip.textContent = TOOLTIP_TEXT
    document.body.appendChild(tooltip)

    function show() {
      position_tooltip(trigger, tooltip)
      tooltip.classList.add("visible")
    }

    function hide() {
      tooltip.classList.remove("visible")
    }

    trigger.addEventListener("mouseenter", show)
    trigger.addEventListener("mouseleave", hide)
    trigger.addEventListener("focusin", show)
    trigger.addEventListener("focusout", hide)

    number_node.replaceWith(trigger)

    return () => {
      trigger.removeEventListener("mouseenter", show)
      trigger.removeEventListener("mouseleave", hide)
      trigger.removeEventListener("focusin", show)
      trigger.removeEventListener("focusout", hide)
      tooltip.remove()
    }
  })
</script>

<span bind:this={container} class="safe-address">
  {@render children()}
</span>

<style>
  .safe-address {
    display: contents;
  }

  :global(.safe-address-trigger) {
    text-decoration: underline dotted;
    cursor: help;
  }

  :global(.safe-address-tooltip) {
    display: none;
    position: fixed;
    width: max-content;
    max-width: 240px;
    padding: var(--dimension-spacing-2)
      var(--dimension-spacing-3);
    background-color: var(--color-neutrals-950);
    color: var(--color-absolute-white);
    border-radius: var(--dimension-radius-lg);
    z-index: 9999;
    pointer-events: none;
  }

  :global(.safe-address-tooltip--top) {
    translate: -50% -100%;
  }

  :global(.safe-address-tooltip--top)::after {
    content: "";
    position: absolute;
    top: 100%;
    left: 50%;
    translate: -50% 0;
    border: 6px solid transparent;
    border-top-color: var(--color-neutrals-950);
  }

  :global(.safe-address-tooltip--bottom) {
    translate: -50% 0;
  }

  :global(.safe-address-tooltip--bottom)::before {
    content: "";
    position: absolute;
    bottom: 100%;
    left: 50%;
    translate: -50% 0;
    border: 6px solid transparent;
    border-bottom-color: var(--color-neutrals-950);
  }

  :global(.safe-address-tooltip.visible) {
    display: block;
  }
</style>

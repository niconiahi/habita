import {
  Children,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import "~/components/carousel.css"

export function Root({
  children,
}: {
  children: ReactNode
}) {
  const images_ref = useRef<HTMLDivElement>(null)
  const [current_index, set_current_index] = useState(0)

  useEffect(() => {
    const images = images_ref.current
    if (!images) return
    function handle_scroll(carousel: HTMLDivElement) {
      const scroll_left = carousel.scrollLeft
      const item_width = carousel.clientWidth
      const next_index = Math.round(
        scroll_left / item_width,
      )
      set_current_index(next_index)
    }
    images.addEventListener("scroll", () =>
      handle_scroll(images),
    )
    return function () {
      images.removeEventListener("scroll", () =>
        handle_scroll(images),
      )
    }
  }, [children])

  return (
    <div className="carousel">
      <div className="images" ref={images_ref}>
        {children}
      </div>
      <ol className="dots">
        {Children.map(children, (_, index) => {
          const key = `dot-${index}`
          return (
            <li
              key={key}
              className={
                index === current_index
                  ? "dot active"
                  : "dot"
              }
              aria-current={
                index === current_index ? "true" : "false"
              }
            />
          )
        })}
      </ol>
    </div>
  )
}

export function Item({
  children,
}: {
  children: ReactNode
}) {
  return <div>{children}</div>
}

export const Carousel = {
  Root,
  Item,
}

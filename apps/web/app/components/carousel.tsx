import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import "~/components/carousel.css"

export function Root({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  const images_ref = useRef<HTMLDivElement>(null)
  const [current_index, set_current_index] = useState(0)
  const images_count = Children.count(children)
  function scroll_to_slide(index: number) {
    const images = images_ref.current
    if (!images) return
    const item_width = images.clientWidth
    images.scrollTo({
      left: index * item_width,
      behavior: "smooth",
    })
  }
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
    const handler = () => handle_scroll(images)
    images.addEventListener("scroll", handler)
    return function () {
      images.removeEventListener("scroll", handler)
    }
  }, [children])
  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div
        className="images"
        ref={images_ref}
        aria-live="polite"
        aria-atomic="false"
      >
        {Children.map(children, (child, index) => {
          if (!isValidElement(child)) return child
          const is_current = index === current_index
          return cloneElement(child, {
            index,
            total: images_count,
            is_current,
          } as SlideProps)
        })}
      </div>
      <div
        role="group"
        aria-label="Slide navigation"
        className="dots"
      >
        {Children.map(children, (_, index) => {
          const key = `dot-${index}`
          const image_number = index + 1
          return (
            <button
              type="button"
              key={key}
              className={
                index === current_index
                  ? "dot active"
                  : "dot"
              }
              aria-label={`Go to slide ${image_number} of ${images_count}`}
              aria-current={
                index === current_index ? "true" : undefined
              }
              onClick={() => scroll_to_slide(index)}
            />
          )
        })}
      </div>
    </section>
  )
}

type SlideProps = {
  children: ReactNode
  index: number
  total: number
  is_current: boolean
}
export function Slide({
  children,
  index,
  total,
  is_current,
}: SlideProps) {
  const label = `slide ${index + 1} of ${total}`
  return (
    <figure
      aria-roledescription="slide"
      aria-label={label}
      aria-hidden={!is_current}
      inert={!is_current ? true : undefined}
    >
      {children}
    </figure>
  )
}

export const Carousel = {
  Root,
  Slide,
}

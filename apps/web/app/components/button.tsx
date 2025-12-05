import { type ComponentProps } from "react"
import "~/components/button.css"

type RootProps = ComponentProps<"button">
function Root({ children, className, ...props }: RootProps) {
  const class_name = className ? `button ${className}` : "button"
  return (
    <button className={class_name} {...props}>
      {children}
    </button>
  )
}

export const Button = {
  Root,
}

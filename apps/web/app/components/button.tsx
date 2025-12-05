import { type ComponentProps } from "react"
import "~/components/button.css"

type ButtonProps = ComponentProps<"button">
export function Button({ children, className, ...props }: ButtonProps) {
  const class_name = className ? `button ${className}` : "button"
  return (
    <button className={class_name} {...props}>
      {children}
    </button>
  )
}

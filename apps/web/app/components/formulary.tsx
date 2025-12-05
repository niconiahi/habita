import { useId, type ReactNode, type ComponentPropsWithoutRef } from "react"
import "~/components/formulary.css"

type RootProps = {
  children: ReactNode
  label: string
}
function Root({ children, label }: RootProps) {
  return (
    <main className="formulary" aria-label={label}>
      {children}
    </main>
  )
}

type SectionProps = {
  children: ReactNode
}
function Section({ children }: SectionProps) {
  return <section>{children}</section>
}

type TitleProps = {
  children: ReactNode
}
function Title({ children }: TitleProps) {
  return <h3>{children}</h3>
}

type LabelProps = {
  children: ReactNode
  htmlFor?: string
}
function Label({ children, htmlFor }: LabelProps) {
  return <label htmlFor={htmlFor}>{children}</label>
}

type InputProps = ComponentPropsWithoutRef<"input">
function Input(props: InputProps) {
  return <input {...props} />
}

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  children: ReactNode
}
function Select({ children, ...props }: SelectProps) {
  return <select {...props}>{children}</select>
}

type RadioProps = Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  children: ReactNode
}
function Radio({ children, id, ...props }: RadioProps) {
  const generated_id = useId()
  const input_id = id ?? generated_id
  return (
    <span className="radio">
      <input type="radio" id={input_id} {...props} />
      <label htmlFor={input_id}>{children}</label>
    </span>
  )
}

export const Formulary = {
  Root,
  Section,
  Title,
  Label,
  Input,
  Select,
  Radio,
}

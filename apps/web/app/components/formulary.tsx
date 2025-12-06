import {
  useId,
  type ReactNode,
  type ComponentPropsWithoutRef,
} from "react"
import "~/components/formulary.css"

function Root({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="formulary" aria-label={label}>
      {children}
    </div>
  )
}
function Section({ children }: { children: ReactNode }) {
  return <section>{children}</section>
}

function Header({ children }: { children: ReactNode }) {
  return <header className="header">{children}</header>
}
function Actions({ children }: { children: ReactNode }) {
  return <div className="actions">{children}</div>
}
function Title({ children }: { children: ReactNode }) {
  return <h3>{children}</h3>
}
function Label({
  children,
  htmlFor,
}: {
  children: ReactNode
  htmlFor?: string
}) {
  return <label htmlFor={htmlFor}>{children}</label>
}
function Input(props: ComponentPropsWithoutRef<"input">) {
  return <input {...props} />
}
function Select({
  children,
  ...props
}: ComponentPropsWithoutRef<"select"> & {
  children: ReactNode
}) {
  return <select {...props}>{children}</select>
}
function Radio({
  children,
  id,
  ...props
}: Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  children: ReactNode
}) {
  const generated_id = useId()
  const input_id = id ?? generated_id
  return (
    <span className="radio">
      <input type="radio" id={input_id} {...props} />
      <label htmlFor={input_id}>{children}</label>
    </span>
  )
}
function Checkbox({
  children,
  id,
  ...props
}: Omit<ComponentPropsWithoutRef<"input">, "type"> & {
  children: ReactNode
}) {
  const generated_id = useId()
  const input_id = id ?? generated_id
  return (
    <span className="checkbox">
      <input type="checkbox" id={input_id} {...props} />
      <label htmlFor={input_id}>{children}</label>
    </span>
  )
}
function Field({ children }: { children: ReactNode }) {
  return <div className="field">{children}</div>
}
function Error({ children }: { children: ReactNode }) {
  return <span className="error">{children}</span>
}

export const Formulary = {
  Root,
  Section,
  Header,
  Actions,
  Title,
  Label,
  Input,
  Select,
  Radio,
  Checkbox,
  Field,
  Error,
}

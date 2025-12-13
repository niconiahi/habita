import {
  type ComponentPropsWithoutRef,
  type ReactNode,
  useId,
} from "react"
import { Form } from "react-router"
import "~/components/formulary.css"

function Root({
  children,
  ...props
}: ComponentPropsWithoutRef<typeof Form> & {
  children: ReactNode
}) {
  return (
    <Form className="formulary" {...props}>
      {children}
    </Form>
  )
}
function Fields({ children }: { children: ReactNode }) {
  return <div className="fields">{children}</div>
}
function Actions({ children }: { children: ReactNode }) {
  return <div className="actions">{children}</div>
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
function Textarea(
  props: ComponentPropsWithoutRef<"textarea">,
) {
  return <textarea {...props} />
}

export const Formulary = {
  Root,
  Fields,
  Actions,
  Label,
  Input,
  Select,
  Radio,
  Checkbox,
  Field,
  Error,
  Textarea,
}

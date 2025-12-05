import type { ReactNode } from "react"
import "~/components/table.css"

type RootProps = {
  children: ReactNode
}
function Root({ children }: RootProps) {
  return <table className="table">{children}</table>
}

type HeaderProps = {
  children: ReactNode
}
function Header({ children }: HeaderProps) {
  return (
    <thead>
      <tr>{children}</tr>
    </thead>
  )
}

type BodyProps = {
  children: ReactNode
}
function Body({ children }: BodyProps) {
  return <tbody>{children}</tbody>
}

type RowProps = {
  children: ReactNode
}
function Row({ children }: RowProps) {
  return <tr>{children}</tr>
}

type CellProps = {
  children: ReactNode
  header?: boolean
}
function Cell({ children, header }: CellProps) {
  if (header) {
    return <th>{children}</th>
  }
  return <td>{children}</td>
}

export const Table = {
  Root,
  Header,
  Body,
  Row,
  Cell,
}

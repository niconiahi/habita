1. Declare `props` always inline, unless you reuse such prop. That's the only case where you should define the prop's types as a separate declaration

No:
```tsx
type RootProps = {
  children: ReactNode
  label: string
}
function Root({ children, label }: RootProps) {
  return (
    <nav className="dashboard" aria-label={label}>
      {children}
    </nav>
  )
}
```

Yes:
```tsx
function Root({
  children,
  label 
}: {
  children: ReactNode
  label: string
}) {
  return (
    <nav className="dashboard" aria-label={label}>
      {children}
    </nav>
  )
}
```


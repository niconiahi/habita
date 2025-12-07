This skills guides on best practices when creating any React related code. This is how this team writes React, so it should be respected to the detail

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

2. Prevent usage of `useEffect` at all costs. If the implementation can be moved to the server, we should do that instead

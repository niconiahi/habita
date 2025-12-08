A route using `Content` to define foundational layout

```tsx
  export default function() {
    return (
      <Content.Root label="Detalles de la propiedad">
        <Content.Section>
          <Content.Title>Información general</Content.Title>
          <p>Dirección: Av. Corrientes 1234, CABA</p>
          <p>Tipo: Departamento</p>
        </Content.Section>
        <Content.Section>
          <Content.Title>Características</Content.Title>
          <ul>
            <li>3 ambientes</li>
            <li>Balcón</li>
            <li>Cochera</li>
          </ul>
        </Content.Section>
        <Content.Section>
          <Content.Title>Servicios incluidos</Content.Title>
          <p>Agua, gas y expensas incluidas en el alquiler.</p>
        </Content.Section>
      </Content.Root>
    )
  }
```

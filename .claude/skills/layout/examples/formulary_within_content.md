```tsx
export default function () {
  return (
    <Content.Root label="Contactar al propietario">
      <Content.Title>Edicion de propiedad</Content.Title>
      <Content.Section>
        <Section.Header>
          <Section.Title>Habitaciones</Section.Title>
          <Section.Actions>
            <Form method="POST">
              <Button
                type="submit"
                name="intent"
                value={INTENT.CREATE_ROOM}
              >
                Agregar habitacion
              </Button>
            </Form>
          </Section.Actions>
        </Section.Header>
        <Formulary.Root method="POST">
          <Formulary.Fields>
            <Formulary.Field>
              <Formulary.Label
                htmlFor={`type_${room.id}`}
              >
                Tipo
              </Formulary.Label>
              <Formulary.Select
                name="type"
                id={`type_${room.id}`}
                defaultValue={room.type}
              >
                {Object.values(ROOM_TYPE).map((type) => {
                  const option_id = `room_type_${type}`
                  return (
                    <option key={option_id} value={type}>
                      {display_room_type(type)}
                    </option>
                  )
                })}
              </Formulary.Select>
            </Formulary.Field>
            <Formulary.Field>
              <Formulary.Label
                htmlFor={`length_${room.id}`}
              >
                Largo
              </Formulary.Label>
              <Formulary.Input
                id={`length_${room.id}`}
                type="number"
                name="length"
                step={0.1}
                defaultValue={room.length}
              />
            </Formulary.Field>
            <Formulary.Field>
              <Formulary.Label
                htmlFor={`width_${room.id}`}
              >
                Ancho
              </Formulary.Label>
              <Formulary.Input
                id={`width_${room.id}`}
                type="number"
                name="width"
                defaultValue={room.width}
              />
            </Formulary.Field>
            <Formulary.Field>
              <Formulary.Label htmlFor="name">
                Ancho
              </Formulary.Label>
              <Formulary.Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Juan Pérez"
              />
            </Formulary.Field>
          </Formulary.Fields>
          <Formulary.Actions>
            <Button type="submit">Enviar mensaje</Button>
          </Formulary.Actions>
        </Formulary.Root>
      </Content.Section>
    </Content.Root>
  )
}
```

import { useEffect, useState } from "react"

export default function () {
  const id = "location"
  return (
    <main>
      <h1>create property</h1>
      <section>
        <h2>ubicacion</h2>
        <p>
          <label htmlFor={id}>direccion</label>
          <LocationInput id={id} />
        </p>
      </section>
    </main>
  )
}

function LocationInput({ id }: { id: string }) {
  const [query, setQuery] = useState<string>()
  const [locations, setLocations] = useState<Location[]>([])
  return (
    <div>
      <input
        id={id}
        value={query}
        onChange={async (event) => {
          const query = event.currentTarget.value
          const url = new URL("/locations/search")
          url.searchParams.set("q", query)
          const response = await fetch(url).catch(() => {
            throw new Error(
              "unknown error while searching for an address",
            )
          })
          if (!response.ok) {
            throw new Error(
              "there was an error while searching for an address",
            )
          }
          const data = response.json()
        }}
      />
      {locations.length ? <ul>{locations.map}</ul> : null}
    </div>
  )
}

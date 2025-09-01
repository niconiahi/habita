# RESTful Resource Routes in React Router v7

This guide explains how to implement RESTful resource routes using React Router v7's configuration-based routing.

## Understanding `index()` vs `route()`

### `index()` Function
- Creates a **default route** that renders at the parent URL
- Used for the main listing page (e.g., `/properties` shows all properties)
- Does NOT add a path segment
- Renders into the parent's `<Outlet />`

### `route()` Function  
- Creates a route with a **specific path segment**
- Used for actions like "new", "edit", or dynamic parameters like ":id"
- Adds the specified segment to the URL

## Complete routes.ts Solution

Replace your commented routes with this implementation:

```typescript
import {
  index,
  route,
  type RouteConfig,
} from "@react-router/dev/routes"

export default [
  index("routes/home.tsx"),
  
  // Properties resource - RESTful routes
  route("properties", "routes/properties/layout.tsx", [
    // GET /properties -> properties#index (list all)
    index("routes/properties/_index.tsx"),
    
    // GET /properties/new -> properties#new (new form)  
    route("new", "routes/properties/new.tsx"),
    
    // GET /properties/:id -> properties#show (show one)
    route(":id", "routes/properties/$id.tsx"),
    
    // GET /properties/:id/edit -> properties#edit (edit form)
    route(":id/edit", "routes/properties/$id.edit.tsx"),
  ])
] satisfies RouteConfig
```

## File Structure & Naming Conventions

```
app/routes/
├── home.tsx
└── properties/
    ├── layout.tsx          # Parent layout with <Outlet />
    ├── _index.tsx         # GET /properties (list all)
    ├── new.tsx            # GET /properties/new 
    ├── $id.tsx            # GET /properties/:id (show one)
    └── $id.edit.tsx       # GET /properties/:id/edit
```

### Naming Rules:
- `_index.tsx` - Index routes (renders at parent URL)
- `$id.tsx` - Dynamic parameters (`:id` in URL)
- `new.tsx` - Static segments
- `$id.edit.tsx` - Nested dynamic + static segments

## Route File Examples

### 1. Layout Route (`routes/properties/layout.tsx`)
```typescript
import { Outlet } from "react-router"

export default function PropertiesLayout() {
  return (
    <div>
      <nav>
        <a href="/properties">All Properties</a>
        <a href="/properties/new">New Property</a>
      </nav>
      <main>
        <Outlet /> {/* Child routes render here */}
      </main>
    </div>
  )
}
```

### 2. Index Route (`routes/properties/_index.tsx`) 
```typescript
import { json, useLoaderData } from "react-router"
import type { Route } from "./+types/_index"

// GET /properties - List all properties
export async function loader({ request }: Route.LoaderArgs) {
  // Fetch properties from your database
  const properties = await getProperties()
  return json({ properties })
}

// POST /properties - Create new property  
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData()
  const property = await createProperty(formData)
  return redirect(`/properties/${property.id}`)
}

export default function PropertiesIndex() {
  const { properties } = useLoaderData<typeof loader>()
  
  return (
    <div>
      <h1>All Properties</h1>
      <ul>
        {properties.map(property => (
          <li key={property.id}>
            <a href={`/properties/${property.id}`}>
              {property.title}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

### 3. New Route (`routes/properties/new.tsx`)
```typescript
import { Form } from "react-router"

// GET /properties/new - Show new property form
export default function NewProperty() {
  return (
    <div>
      <h1>New Property</h1>
      <Form method="post" action="/properties">
        <input name="title" placeholder="Property title" required />
        <textarea name="description" placeholder="Description" />
        <button type="submit">Create Property</button>
      </Form>
    </div>
  )
}
```

### 4. Show Route (`routes/properties/$id.tsx`)
```typescript
import { json, useLoaderData } from "react-router"
import type { Route } from "./+types/$id"

// GET /properties/:id - Show single property
export async function loader({ params }: Route.LoaderArgs) {
  const property = await getProperty(params.id)
  if (!property) {
    throw new Response("Property not found", { status: 404 })
  }
  return json({ property })
}

// PATCH/PUT /properties/:id - Update property
export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData()
  const property = await updateProperty(params.id, formData)
  return redirect(`/properties/${property.id}`)
}

// DELETE /properties/:id - Delete property  
export async function destroy({ params }: Route.ActionArgs) {
  await deleteProperty(params.id)
  return redirect("/properties")
}

export default function PropertyShow() {
  const { property } = useLoaderData<typeof loader>()
  
  return (
    <div>
      <h1>{property.title}</h1>
      <p>{property.description}</p>
      
      <div>
        <a href={`/properties/${property.id}/edit`}>Edit</a>
        <Form method="delete">
          <button type="submit">Delete</button>  
        </Form>
      </div>
    </div>
  )
}
```

### 5. Edit Route (`routes/properties/$id.edit.tsx`)
```typescript
import { json, useLoaderData, Form } from "react-router"
import type { Route } from "./+types/$id.edit"

// GET /properties/:id/edit - Show edit form
export async function loader({ params }: Route.LoaderArgs) {
  const property = await getProperty(params.id)
  if (!property) {
    throw new Response("Property not found", { status: 404 })
  }
  return json({ property })
}

export default function EditProperty() {
  const { property } = useLoaderData<typeof loader>()
  
  return (
    <div>
      <h1>Edit Property</h1>
      <Form method="patch" action={`/properties/${property.id}`}>
        <input 
          name="title" 
          defaultValue={property.title}
          placeholder="Property title" 
          required 
        />
        <textarea 
          name="description" 
          defaultValue={property.description}
          placeholder="Description" 
        />
        <button type="submit">Update Property</button>
      </Form>
    </div>
  )
}
```

## The 7 RESTful Routes Explained

| HTTP Method | URL Pattern | Route Function | File Path | Purpose |
|-------------|-------------|----------------|-----------|---------|
| GET | `/properties` | `index()` | `_index.tsx` | List all properties |
| GET | `/properties/new` | `route("new", ...)` | `new.tsx` | Show new property form |
| POST | `/properties` | action in index | `_index.tsx` | Create new property |
| GET | `/properties/:id` | `route(":id", ...)` | `$id.tsx` | Show single property |
| GET | `/properties/:id/edit` | `route(":id/edit", ...)` | `$id.edit.tsx` | Show edit form |
| PATCH/PUT | `/properties/:id` | action in show | `$id.tsx` | Update property |
| DELETE | `/properties/:id` | destroy in show | `$id.tsx` | Delete property |

## Why Use `index()` for `/properties`?

```typescript
// ✅ CORRECT - Use index() for the main resource listing
route("properties", "routes/properties/layout.tsx", [
  index("routes/properties/_index.tsx"),  // Renders at /properties
  // ... other routes
])

// ❌ WRONG - Don't use route() without a path for the main listing  
route("properties", "routes/properties/layout.tsx", [
  route("", "routes/properties/_index.tsx"),  // Confusing and unnecessary
  // ... other routes  
])
```

The `index()` function is specifically designed for default/main content at a URL. It's clearer in intent and follows React Router conventions.

## Key Takeaways

1. **Use `index()` for main resource listings** (e.g., all properties at `/properties`)
2. **Use `route()` for everything else** (new, show, edit routes)
3. **File names matter**: `_index.tsx`, `$id.tsx`, `new.tsx` 
4. **Actions go in the appropriate route file** (create in index, update/delete in show)
5. **Layout routes provide shared UI** with `<Outlet />` for children
6. **Forms submit to different routes** using the `action` prop

This pattern scales to any resource - just replace "properties" with your resource name and follow the same structure.
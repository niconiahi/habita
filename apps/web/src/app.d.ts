// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

declare module "*.svx" {
  import type { Component } from "svelte"
  const component: Component
  export default component
  export const metadata: Record<string, unknown>
}

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: {
        id: number
        email: string
        name: string | null
        surname: string | null
        accesses: Array<{
          id: number
          type: number
          property_id: number
        }>
      } | null
      session: {
        id: string
        user_id: number
        expires_at: Date
        created_at: Date
        updated_at: Date
      } | null
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {}

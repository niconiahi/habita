declare module "*.svx" {
  import type { Component } from "svelte"
  const component: Component
  export default component
  export const metadata: Record<string, unknown>
}

declare global {
  namespace App {
    interface Locals {
      user: {
        id: number
        email: string
        name: string | null
        surname: string | null
      } | null
      session: {
        id: string
        userId: number
        expiresAt: Date
        createdAt: Date
        updatedAt: Date
      } | null
    }
  }
}

export {}

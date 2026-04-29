declare global {
  var __auth: unknown

  namespace App {
    interface Locals {
      user: {
        id: string
        email: string
        name: string
      } | null
      session: {
        id: string
      } | null
    }
  }
}

export {}

declare global {
  var __obs_auth: unknown

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

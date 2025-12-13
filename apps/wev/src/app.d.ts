// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: {
        id: number;
        email: string;
      } | null;
      session: {
        id: string;
        user_id: number;
        expires_at: Date;
        created_at: Date;
        updated_at: Date;
      } | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};

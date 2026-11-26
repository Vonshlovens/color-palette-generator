/// <reference types="@sveltejs/kit" />

import type { Auth } from '$lib/server/auth';
import type { AuthConfig } from '$lib/server/auth/config';
import type { AppDatabase } from '$lib/server/db';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      db: AppDatabase;
      auth: Auth;
      authConfig: AuthConfig;
      /** The signed-in, approved user; null for anonymous visitors. */
      user: { id: string; email: string; name: string; isOwner: boolean } | null;
    }
    // interface PageData {}
    // interface PageState {}
    // interface Platform {}
  }
}

export {};

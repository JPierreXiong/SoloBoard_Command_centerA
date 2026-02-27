import { betterAuth } from 'better-auth';

import { getAuthOptions, authOptions } from './config';

// Static auth instance - for API routes
// This is initialized lazily on first use
let authInstance: Awaited<ReturnType<typeof betterAuth>> | null = null;

export const auth = new Proxy({} as Awaited<ReturnType<typeof betterAuth>>, {
  get(target, prop) {
    if (!authInstance) {
      // Initialize on first access
      authInstance = betterAuth(authOptions as any);
    }
    return (authInstance as any)[prop];
  },
});

// Dynamic auth - with full database configuration
// Always use this in API routes that need database access
export async function getAuth(): Promise<
  Awaited<ReturnType<typeof betterAuth>>
> {
  return betterAuth(await getAuthOptions());
}

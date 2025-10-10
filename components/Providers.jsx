'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Global provider for NextAuth session context.
 * All client components (like dashboard) can use `useSession()` safely.
 */
export default function Providers({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}

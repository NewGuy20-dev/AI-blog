'use client';

import { Auth0Provider, useUser } from '@auth0/nextjs-auth0/client';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { ReactNode, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@/lib/ThemeProvider';
import { AccountsProvider } from '@/lib/AccountsProvider';
import { Toaster } from 'sonner';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

function ConvexAuthSync({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();

  const fetchToken = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/convex-token');
      if (!res.ok) return null;
      const data = await res.json();
      return data.token ?? null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      convex.setAuth(fetchToken);
    } else {
      convex.clearAuth();
    }
  }, [user, isLoading, fetchToken]);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Auth0Provider>
      <ConvexAuthSync>
        <ThemeProvider>
          <AccountsProvider>{children}</AccountsProvider>
        </ThemeProvider>
        <Toaster position="bottom-right" richColors />
      </ConvexAuthSync>
    </Auth0Provider>
  );
}

'use client';

import { Auth0Provider, useUser } from '@auth0/nextjs-auth0/client';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { ReactNode, useEffect, useCallback, useState } from 'react';
import { ThemeProvider } from '@/lib/ThemeProvider';
import { AccountsProvider } from '@/lib/AccountsProvider';
import { Toaster } from 'sonner';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const BANNED_USER_IDS = [
  "google-oauth2|109465743242996396619",
  "google-oauth2|103430903957817165722",
];

function IpBlockCheck({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState<{ blocked: boolean; reason?: string } | null>(null);

  useEffect(() => {
    fetch('/api/check-ip')
      .then(res => res.json())
      .then(setBlocked)
      .catch(() => setBlocked({ blocked: false }));
  }, []);

  if (blocked === null) return null;

  if (blocked.blocked) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">Your IP address has been blocked.</p>
          {blocked.reason && <p className="text-gray-500 text-sm mt-2">Reason: {blocked.reason}</p>}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ConvexAuthSync({ children }: { children: ReactNode }) {
  const { user, isLoading } = useUser();

  // Check if user is banned
  if (!isLoading && user && BANNED_USER_IDS.includes(user.sub as string)) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Account Suspended</h1>
          <p className="text-gray-400">Your account has been banned.</p>
        </div>
      </div>
    );
  }

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
      <IpBlockCheck>
        <ConvexAuthSync>
          <ThemeProvider>
            <AccountsProvider>{children}</AccountsProvider>
          </ThemeProvider>
          <Toaster position="bottom-right" richColors />
        </ConvexAuthSync>
      </IpBlockCheck>
    </Auth0Provider>
  );
}

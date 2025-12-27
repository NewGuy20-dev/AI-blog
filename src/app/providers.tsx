'use client';

import { Auth0Provider, useUser } from '@auth0/nextjs-auth0/client';
import { ConvexReactClient, ConvexProvider, useMutation } from 'convex/react';
import { ReactNode, useEffect, useCallback, useState } from 'react';
import { ThemeProvider } from '@/lib/ThemeProvider';
import { AccountsProvider } from '@/lib/AccountsProvider';
import { Toaster } from 'sonner';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { api } from '../../convex/_generated/api';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const BANNED_USER_IDS = [
  "google-oauth2|109465743242996396619",
  "google-oauth2|103430903957817165722",
];

function SecurityCheck({ children }: { children: ReactNode }) {
  const [blocked, setBlocked] = useState<{ blocked: boolean; reason?: string; type?: string } | null>(null);
  const { user } = useUser();

  useEffect(() => {
    async function checkSecurity() {
      try {
        // Check IP block and VPN
        const ipRes = await fetch('/api/check-ip');
        const ipData = await ipRes.json();
        
        if (ipData.blocked) {
          setBlocked({ blocked: true, reason: ipData.reason, type: 'ip' });
          return;
        }

        if (ipData.isVpn) {
          setBlocked({ blocked: true, reason: 'VPN/Proxy detected', type: 'vpn' });
          return;
        }

        // Check fingerprint
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        const visitorId = result.visitorId;

        // Store fingerprint in localStorage for persistence
        localStorage.setItem('fp_visitor_id', visitorId);

        // Check if fingerprint is banned
        const fpRes = await fetch(`/api/check-fingerprint?id=${visitorId}`);
        const fpData = await fpRes.json();

        if (fpData.banned) {
          setBlocked({ blocked: true, reason: fpData.reason, type: 'fingerprint' });
          return;
        }

        // Track fingerprint
        await fetch('/api/track-fingerprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            visitorId,
            userId: user?.sub,
            ip: ipData.ip,
          }),
        });

        setBlocked({ blocked: false });
      } catch {
        setBlocked({ blocked: false });
      }
    }

    checkSecurity();
  }, [user]);

  if (blocked === null) return null;

  if (blocked.blocked) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">
            {blocked.type === 'vpn' ? 'VPN/Proxy connections are not allowed.' : 
             blocked.type === 'fingerprint' ? 'Your device has been blocked.' :
             'Your IP address has been blocked.'}
          </p>
          {blocked.reason && blocked.type !== 'vpn' && (
            <p className="text-gray-500 text-sm mt-2">Reason: {blocked.reason}</p>
          )}
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
      <SecurityCheck>
        <ConvexAuthSync>
          <ThemeProvider>
            <AccountsProvider>{children}</AccountsProvider>
          </ThemeProvider>
          <Toaster position="bottom-right" richColors />
        </ConvexAuthSync>
      </SecurityCheck>
    </Auth0Provider>
  );
}

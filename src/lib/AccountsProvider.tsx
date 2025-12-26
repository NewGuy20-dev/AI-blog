'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface StoredAccount {
  sub: string;
  name: string;
  email: string;
  picture?: string;
}

interface AccountsContextType {
  accounts: StoredAccount[];
  currentAccount: StoredAccount | null;
  addCurrentAccount: () => void;
  removeAccount: (sub: string) => void;
  switchAccount: (sub: string) => void;
}

const AccountsContext = createContext<AccountsContextType>({
  accounts: [],
  currentAccount: null,
  addCurrentAccount: () => {},
  removeAccount: () => {},
  switchAccount: () => {},
});

export const useAccounts = () => useContext(AccountsContext);

const STORAGE_KEY = 'pageo_accounts';

export function AccountsProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [accounts, setAccounts] = useState<StoredAccount[]>([]);

  // Load accounts from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setAccounts(JSON.parse(stored));
      } catch {}
    }
  }, []);

  // Save accounts to localStorage
  useEffect(() => {
    if (accounts.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
    }
  }, [accounts]);

  // Add current user to accounts if not already there
  const addCurrentAccount = () => {
    if (!user?.sub) return;
    
    const exists = accounts.some(a => a.sub === user.sub);
    if (!exists) {
      const newAccount: StoredAccount = {
        sub: user.sub,
        name: user.name || 'User',
        email: user.email || '',
        picture: user.picture || undefined,
      };
      setAccounts(prev => [...prev, newAccount]);
    }
  };

  // Auto-add current user when they log in
  useEffect(() => {
    if (user?.sub) {
      addCurrentAccount();
    }
  }, [user?.sub]);

  const removeAccount = (sub: string) => {
    setAccounts(prev => prev.filter(a => a.sub !== sub));
    const remaining = accounts.filter(a => a.sub !== sub);
    if (remaining.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const switchAccount = (sub: string) => {
    // If switching to a different account, logout and login with prompt
    if (user?.sub !== sub) {
      // Store the target account sub to switch to
      sessionStorage.setItem('switch_to_account', sub);
      // Logout and re-login with account selection
      window.location.href = '/auth/login?prompt=login';
    }
  };

  const currentAccount = user?.sub 
    ? accounts.find(a => a.sub === user.sub) || null 
    : null;

  return (
    <AccountsContext.Provider value={{
      accounts,
      currentAccount,
      addCurrentAccount,
      removeAccount,
      switchAccount,
    }}>
      {children}
    </AccountsContext.Provider>
  );
}

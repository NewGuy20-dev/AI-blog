'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useTheme } from '@/lib/ThemeProvider';
import { useAccounts } from '@/lib/AccountsProvider';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Moon, Settings, Plus, Check, X } from 'lucide-react';

interface UserMenuProps {
  position?: 'top' | 'bottom';
}

export function UserMenu({ position = 'bottom' }: UserMenuProps) {
  const { user, isLoading } = useUser();
  const { theme, toggle } = useTheme();
  const { accounts, removeAccount, switchAccount } = useAccounts();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading) {
    return <div className="w-9 h-9 rounded-full bg-[var(--color-border)] animate-pulse" />;
  }

  if (!user) {
    return (
      <a
        href="/auth/login"
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full border border-[var(--color-border)] hover:bg-[var(--color-primary)] hover:text-white hover:border-[var(--color-primary)] transition-all"
      >
        <User size={16} strokeWidth={1.5} />
        Sign in
      </a>
    );
  }

  const Avatar = ({ src, name, email, size = 36, className = '' }: { 
    src?: string | null; 
    name?: string | null; 
    email?: string | null;
    size?: number; 
    className?: string 
  }) =>
    src ? (
      <Image
        src={src}
        alt={name || ''}
        width={size}
        height={size}
        className={`rounded-full ${className}`}
        referrerPolicy="no-referrer"
      />
    ) : (
      <div
        className={`rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white font-medium ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.4 }}
      >
        {(name?.[0] || email?.[0] || '?').toUpperCase()}
      </div>
    );

  const dropdownClasses = position === 'top'
    ? 'top-full mt-2 right-0 animate-in fade-in slide-in-from-top-2'
    : 'bottom-full mb-2 right-0 animate-in fade-in slide-in-from-bottom-2';

  return (
    <div className="relative z-[60]" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="cursor-pointer rounded-full focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
      >
        <Avatar src={user.picture} name={user.name} email={user.email} />
      </button>

      {open && (
        <div
          className={`absolute w-[300px] rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] shadow-lg z-[100] duration-150 ${dropdownClasses}`}
        >
          {/* Account Switcher */}
          <div className="p-3">
            <p className="text-xs text-[var(--color-text-muted)] mb-2 px-2">
              {accounts.length > 1 ? 'Switch Account' : 'Account'}
            </p>
            
            {/* Current account */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-[var(--color-accent)]/30">
              <Avatar src={user.picture} name={user.name} email={user.email} size={36} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--color-text)] truncate">
                  {user.name || 'User'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {user.email}
                </p>
              </div>
              <Check size={16} className="text-[var(--color-primary)] flex-shrink-0" />
            </div>

            {/* Other accounts */}
            {accounts
              .filter(a => a.sub !== user.sub)
              .map(account => (
                <div
                  key={account.sub}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--color-accent)]/50 cursor-pointer transition-colors mt-1 group"
                  onClick={() => switchAccount(account.sub)}
                >
                  <Avatar src={account.picture} name={account.name} email={account.email} size={36} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text)] truncate">
                      {account.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] truncate">
                      {account.email}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeAccount(account.sub);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-border)] transition-all"
                  >
                    <X size={14} className="text-[var(--color-text-muted)]" />
                  </button>
                </div>
              ))}
          </div>

          {/* Logout All */}
          <div className="px-3 pb-3">
            <a
              href="/auth/logout"
              className="flex items-center justify-center gap-2 w-full py-2.5 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-accent)]/50 transition-colors"
            >
              <LogOut size={16} strokeWidth={1.5} />
              {accounts.length > 1 ? 'Logout of all accounts' : 'Logout'}
            </a>
          </div>

          <div className="h-px bg-[var(--color-border)]" />

          {/* Settings Section */}
          <div className="p-2">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between h-11 px-3 rounded-lg hover:bg-[var(--color-accent)]/50 transition-colors">
              <div className="flex items-center gap-3">
                <Moon size={18} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
                <span className="text-sm">Dark Mode</span>
              </div>
              <button
                onClick={toggle}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-border)]'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    theme === 'dark' ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {/* Profile */}
            <a
              href="/profile"
              className="flex items-center gap-3 h-11 px-3 rounded-lg hover:bg-[var(--color-accent)]/50 transition-colors"
            >
              <Settings size={18} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
              <span className="text-sm">Profile</span>
            </a>

            {/* Add Account */}
            <a
              href="/auth/login?prompt=login"
              className="flex items-center gap-3 h-11 px-3 rounded-lg hover:bg-[var(--color-accent)]/50 transition-colors"
            >
              <Plus size={18} strokeWidth={1.5} className="text-[var(--color-text-muted)]" />
              <span className="text-sm">Add Account</span>
            </a>

            {/* Logout */}
            <a
              href="/auth/logout"
              className="flex items-center gap-3 h-11 px-3 rounded-lg hover:bg-[var(--color-accent)]/50 transition-colors text-red-500"
            >
              <LogOut size={18} strokeWidth={1.5} />
              <span className="text-sm">Logout</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import Image from "next/image";
import { SettingsLayout } from "@/components/ui/SettingsLayout";
import { Mail, Shield, Trash2, ExternalLink, Key, Smartphone, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export default function AccountPage() {
  const { user, isLoading } = useUser();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  if (isLoading) {
    return (
      <SettingsLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-[var(--color-border)]/30 rounded" />
          <div className="h-32 bg-[var(--color-border)]/30 rounded-xl" />
          <div className="h-24 bg-[var(--color-border)]/30 rounded-xl" />
        </div>
      </SettingsLayout>
    );
  }

  if (!user) {
    return (
      <SettingsLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Shield size={32} className="text-[var(--color-text-muted)]" />
          <p className="text-[var(--color-text-muted)]">Please sign in to manage your account</p>
          <a
            href="/auth/login"
            className="px-6 py-2.5 bg-[var(--color-primary)] text-white rounded-xl hover:opacity-90 transition-opacity font-medium"
          >
            Sign in
          </a>
        </div>
      </SettingsLayout>
    );
  }

  // Parse connection info from user
  const identities = (user as any).identities || [];
  const connections = identities.map((id: any) => ({
    provider: id.provider,
    connected: true,
  }));

  // Add common providers that might not be connected
  const allProviders = [
    { id: "google-oauth2", name: "Google", icon: "🔵" },
    { id: "github", name: "GitHub", icon: "⚫" },
    { id: "twitter", name: "Twitter", icon: "🐦" },
  ];

  return (
    <SettingsLayout>
      <h1 className="text-2xl font-bold mb-8">Account</h1>

      {/* Profile Section */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          Profile Information
        </h2>
        <div className="p-6 rounded-xl border border-[var(--color-border)] space-y-6">
          <div className="flex items-center gap-4">
            {user.picture ? (
              <Image
                src={user.picture}
                alt={user.name || ""}
                width={64}
                height={64}
                className="rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary)] flex items-center justify-center text-white text-xl font-medium">
                {(user.name?.[0] || user.email?.[0] || "?").toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-lg">{user.name || "User"}</p>
              <p className="text-sm text-[var(--color-text-muted)] flex items-center gap-1">
                <Mail size={14} />
                {user.email}
                {user.email_verified && (
                  <CheckCircle size={14} className="text-green-500 ml-1" />
                )}
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-accent)]/20">
              <span className="text-sm text-[var(--color-text-muted)]">Display Name</span>
              <span className="font-medium">{user.name || "Not set"}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-accent)]/20">
              <span className="text-sm text-[var(--color-text-muted)]">Email</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--color-accent)]/20">
              <span className="text-sm text-[var(--color-text-muted)]">User ID</span>
              <span className="font-mono text-xs text-[var(--color-text-muted)]">
                {user.sub?.slice(0, 20)}...
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Accounts */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          Connected Accounts
        </h2>
        <div className="space-y-2">
          {allProviders.map((provider) => {
            const isConnected = connections.some((c: any) => 
              c.provider.toLowerCase().includes(provider.id.split("-")[0])
            );
            return (
              <div
                key={provider.id}
                className="p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{provider.icon}</span>
                  <div>
                    <p className="font-medium">{provider.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {isConnected ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {isConnected ? (
                  <CheckCircle size={20} className="text-green-500" />
                ) : (
                  <button className="text-sm text-[var(--color-primary)] hover:underline">
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Security Section */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          Security
        </h2>
        <div className="space-y-2">
          <div className="p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Key size={20} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="font-medium">Password</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Last changed: Unknown
                </p>
              </div>
            </div>
            <a
              href={`https://${process.env.NEXT_PUBLIC_AUTH0_DOMAIN || 'auth0.com'}/u/reset-password`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-accent)]/50 transition-colors flex items-center gap-1"
            >
              Change <ExternalLink size={12} />
            </a>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone size={20} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Add an extra layer of security
                </p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs bg-yellow-500/10 text-yellow-600 rounded-full flex items-center gap-1">
              <AlertCircle size={12} />
              Not enabled
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock size={20} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Manage your logged-in devices
                </p>
              </div>
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">1 active</span>
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-sm font-medium text-red-500 uppercase tracking-wider mb-4">
          Danger Zone
        </h2>
        <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/5">
          {!showDeleteConfirm ? (
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-red-500 flex items-center gap-2">
                  <Trash2 size={18} />
                  Delete Account
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">
                  Permanently delete your account and all associated data.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm border border-red-500 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
              >
                Delete
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-text-muted)]">
                This action cannot be undone. Type <strong>delete my account</strong> to confirm.
              </p>
              <input
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="delete my account"
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-transparent text-sm"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteInput("");
                  }}
                  className="px-4 py-2 text-sm border border-[var(--color-border)] rounded-lg hover:bg-[var(--color-accent)]/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  disabled={deleteInput !== "delete my account"}
                  className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Permanently Delete
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </SettingsLayout>
  );
}

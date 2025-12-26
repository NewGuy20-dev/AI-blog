"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Settings, Shield, Bookmark, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { UserMenu } from "@/components/ui/UserMenu";
import { ReactNode } from "react";

const navItems = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/account", label: "Account", icon: Shield },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/bookmarks", label: "Bookmarks", icon: Bookmark },
];

export function SettingsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="hidden md:block text-[var(--color-text-muted)]">/</span>
            <span className="hidden md:block text-sm font-medium">
              {navItems.find(item => item.href === pathname)?.label || "Settings"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/feed"
              className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
            >
              <ArrowLeft size={16} strokeWidth={1.5} />
              <span className="hidden sm:inline">Back to Feed</span>
            </Link>
            <ThemeToggle />
            <UserMenu position="top" />
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-[var(--color-border)] flex-col p-4">
          <nav className="space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--color-primary)] text-white"
                      : "text-[var(--color-text-muted)] hover:bg-[var(--color-accent)]/50 hover:text-[var(--color-text)]"
                  }`}
                >
                  <Icon size={18} strokeWidth={1.5} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-3xl mx-auto px-4 md:px-8 py-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] z-40">
        <div className="flex justify-around py-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                <Icon size={20} strokeWidth={1.5} />
                <span className="text-xs">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

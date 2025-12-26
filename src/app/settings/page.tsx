"use client";

import { useTheme } from "@/lib/ThemeProvider";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SettingsLayout } from "@/components/ui/SettingsLayout";
import { Moon, Sun, Monitor, Bell, Globe, Eye, Type, Palette, Info } from "lucide-react";
import { useState, useEffect } from "react";

const themeOptions = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const fontSizes = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const accentColors = [
  { value: "purple", color: "#7A4FFF" },
  { value: "blue", color: "#3B82F6" },
  { value: "green", color: "#10B981" },
  { value: "orange", color: "#F97316" },
  { value: "pink", color: "#EC4899" },
];

export default function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { user } = useUser();
  const profile = useQuery(api.userProfiles.get, user ? {} : "skip");
  const updatePreferences = useMutation(api.userProfiles.updatePreferences);

  const [selectedTheme, setSelectedTheme] = useState("system");
  const [fontSize, setFontSize] = useState("medium");
  const [accentColor, setAccentColor] = useState("purple");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [notifications, setNotifications] = useState(false);
  const [emailDigest, setEmailDigest] = useState("weekly");

  // Load preferences from profile
  useEffect(() => {
    if (profile?.preferences) {
      const prefs = profile.preferences;
      if (prefs.theme) setSelectedTheme(prefs.theme);
      if (prefs.fontSize) setFontSize(prefs.fontSize);
      if (prefs.accentColor) setAccentColor(prefs.accentColor);
      if (prefs.reducedMotion !== undefined) setReducedMotion(prefs.reducedMotion);
      if (prefs.pushNotifications !== undefined) setNotifications(prefs.pushNotifications);
      if (prefs.emailDigest) setEmailDigest(prefs.emailDigest);
    }
  }, [profile]);

  const handleThemeChange = (value: string) => {
    setSelectedTheme(value);
    if (value === "dark" && theme !== "dark") toggle();
    if (value === "light" && theme === "dark") toggle();
    if (user) {
      updatePreferences({ theme: value });
    }
  };

  const handlePreferenceChange = (key: string, value: any) => {
    if (user) {
      updatePreferences({ [key]: value });
    }
  };

  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        enabled ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"
      }`}
    >
      <span
        className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          enabled ? "translate-x-5" : ""
        }`}
      />
    </button>
  );

  return (
    <SettingsLayout>
      <h1 className="text-2xl font-bold mb-8">Settings</h1>

      {/* Appearance */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          Appearance
        </h2>
        <div className="space-y-4">
          {/* Theme Selector */}
          <div className="p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-4">
              <Moon size={20} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Choose your preferred color scheme
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => handleThemeChange(value)}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${
                    selectedTheme === value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-[var(--color-border)] hover:bg-[var(--color-accent)]/30"
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-sm">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-4">
              <Palette size={20} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="font-medium">Accent Color</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Customize the primary color
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {accentColors.map(({ value, color }) => (
                <button
                  key={value}
                  onClick={() => {
                    setAccentColor(value);
                    handlePreferenceChange("accentColor", value);
                  }}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    accentColor === value ? "ring-2 ring-offset-2 ring-[var(--color-border)] scale-110" : ""
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-4">
              <Type size={20} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="font-medium">Font Size</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Adjust text size for readability
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {fontSizes.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    setFontSize(value);
                    handlePreferenceChange("fontSize", value);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm transition-colors ${
                    fontSize === value
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-[var(--color-border)] hover:bg-[var(--color-accent)]/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reduced Motion */}
          <div className="p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="font-medium">Reduced Motion</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Minimize animations
                </p>
              </div>
            </div>
            <Toggle
              enabled={reducedMotion}
              onToggle={() => {
                setReducedMotion(!reducedMotion);
                handlePreferenceChange("reducedMotion", !reducedMotion);
              }}
            />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="mb-8">
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          Notifications
        </h2>
        <div className="space-y-2">
          <div className="p-4 rounded-xl border border-[var(--color-border)] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Get notified about new articles
                </p>
              </div>
            </div>
            <Toggle
              enabled={notifications}
              onToggle={() => {
                setNotifications(!notifications);
                handlePreferenceChange("pushNotifications", !notifications);
              }}
            />
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)]">
            <div className="flex items-center gap-3 mb-4">
              <Globe size={20} className="text-[var(--color-text-muted)]" />
              <div>
                <p className="font-medium">Email Digest</p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Receive article summaries via email
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {["daily", "weekly", "never"].map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setEmailDigest(option);
                    handlePreferenceChange("emailDigest", option);
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm capitalize transition-colors ${
                    emailDigest === option
                      ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                      : "border-[var(--color-border)] hover:bg-[var(--color-accent)]/30"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section>
        <h2 className="text-sm font-medium text-[var(--color-text-muted)] uppercase tracking-wider mb-4">
          About
        </h2>
        <div className="p-6 rounded-xl border border-[var(--color-border)]">
          <div className="flex items-center gap-3 mb-4">
            <Info size={20} className="text-[var(--color-text-muted)]" />
            <div>
              <p className="font-bold text-lg">Pageo</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                AI-powered news and articles
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="px-3 py-1 rounded-full bg-[var(--color-accent)]/30">
              Version 1.0.0
            </span>
            <a href="#" className="text-[var(--color-primary)] hover:underline">
              Privacy Policy
            </a>
            <a href="#" className="text-[var(--color-primary)] hover:underline">
              Terms of Service
            </a>
            <a href="#" className="text-[var(--color-primary)] hover:underline">
              Open Source
            </a>
          </div>
        </div>
      </section>
    </SettingsLayout>
  );
}

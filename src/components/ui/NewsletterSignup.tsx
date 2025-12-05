"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Mail } from "lucide-react";

export function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const subscribe = useMutation(api.subscribers.subscribe);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setStatus("loading");
    try {
      await subscribe({ email });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
      <Mail className="mx-auto mb-4" size={32} />
      <h3 className="text-xl font-bold mb-2">Stay Updated</h3>
      <p className="text-white/80 mb-6 text-sm">Get the latest AI news delivered to your inbox.</p>
      {status === "success" ? (
        <p className="text-green-200 font-medium">✓ You&apos;re subscribed!</p>
      ) : (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 px-4 py-2 rounded-full text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-2 bg-white text-indigo-600 font-medium rounded-full hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {status === "loading" ? "..." : "Subscribe"}
          </button>
        </form>
      )}
      {status === "error" && <p className="text-red-200 text-sm mt-2">Something went wrong. Try again.</p>}
    </div>
  );
}

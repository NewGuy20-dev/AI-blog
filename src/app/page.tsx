import Link from "next/link";
import { ArrowRight, Sparkles, Zap, BookOpen } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const features = [
  {
    icon: Sparkles,
    title: "Curated",
    description: "Smart algorithms surface the most relevant news for you",
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    description: "Stay ahead with the latest developments as they happen",
  },
  {
    icon: BookOpen,
    title: "Deep Insights",
    description: "Go beyond headlines with comprehensive analysis",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <ThemeToggle />
      
      {/* Header */}
      <header className="px-6 py-6">
        <Logo />
      </header>

      {/* Hero */}
      <section className="px-6 pt-16 pb-24 md:pt-24 md:pb-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 max-w-3xl mx-auto">
          Your News,{" "}
          <span className="text-[var(--color-primary)]">Curated</span>
        </h1>
        <p className="text-lg md:text-xl text-[var(--color-text-muted)] max-w-xl mx-auto mb-10">
          Stay informed with the latest stories that matter. Personalized, distilled, delivered.
        </p>
        <Link
          href="/feed"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--color-primary)] text-white rounded-full font-medium hover:opacity-90 transition-opacity"
        >
          Explore Feed
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 md:pb-32">
        <div className="max-w-4xl mx-auto grid gap-6 md:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="p-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)]"
            >
              <f.icon size={24} className="text-[var(--color-primary)] mb-4" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-[var(--color-text-muted)]">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-[var(--color-border)] text-center">
        <p className="text-sm text-[var(--color-text-muted)]">© 2024 Pageo</p>
      </footer>
    </div>
  );
}

import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link href="/" className="inline-block group">
      <div className="flex items-center gap-2">
        <div className="pageo-logo w-8 h-8 rounded-lg bg-[var(--color-primary)] flex items-center justify-center overflow-hidden">
          <Image src="/logo.png" alt="Logo" width={32} height={32} />
        </div>
        <span className="text-xl font-semibold tracking-tight group-hover:text-[var(--color-primary)] transition-colors">
          Pageo
        </span>
      </div>
    </Link>
  );
}

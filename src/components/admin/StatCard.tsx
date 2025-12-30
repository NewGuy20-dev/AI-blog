import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "danger" | "success" | "warning";
}

const variantColors = {
  default: "text-violet-400",
  danger: "text-red-400",
  success: "text-green-400",
  warning: "text-yellow-400",
};

export function StatCard({ icon: Icon, label, value, sub, variant = "default" }: StatCardProps) {
  return (
    <div className="glass p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-white/5 ${variantColors[variant]}`}>
          <Icon size={18} />
        </div>
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {sub && <p className="text-sm text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

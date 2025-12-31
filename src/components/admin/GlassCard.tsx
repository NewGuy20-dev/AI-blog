import { ReactNode } from "react";

type Variant = "default" | "danger" | "success" | "warning" | "purple";

interface GlassCardProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
  hover?: boolean;
  padding?: "sm" | "md" | "lg";
}

const variantClasses: Record<Variant, string> = {
  default: "glass",
  danger: "glass glass-danger",
  success: "glass glass-success",
  warning: "glass glass-warning",
  purple: "glass glass-purple",
};

const paddingClasses = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export function GlassCard({ children, variant = "default", className = "", hover = false, padding = "md" }: GlassCardProps) {
  return (
    <div className={`${variantClasses[variant]} ${paddingClasses[padding]} ${hover ? "glass-hover transition-all cursor-pointer" : ""} ${className}`}>
      {children}
    </div>
  );
}

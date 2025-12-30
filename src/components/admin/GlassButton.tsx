import { ReactNode, ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger";

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}

const variantClasses: Record<Variant, string> = {
  primary: "glass-btn",
  secondary: "glass-btn glass-btn-secondary",
  danger: "glass-btn glass-btn-danger",
};

const sizeClasses = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export function GlassButton({ children, variant = "primary", size = "md", className = "", ...props }: GlassButtonProps) {
  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} rounded-lg font-medium ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

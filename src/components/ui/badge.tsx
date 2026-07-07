import { type HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "muted";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[var(--color-primary-subtle)] text-[var(--color-primary)]",
  success: "bg-[var(--color-success-subtle)] text-[var(--color-success)]",
  warning: "bg-[var(--color-warning-subtle)] text-[var(--color-warning)]",
  error:   "bg-[var(--color-error-subtle)] text-[var(--color-error)]",
  muted:   "bg-[var(--color-surface-offset)] text-[var(--color-text-muted)]",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

export function Badge({ variant = "default", className = "", children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}

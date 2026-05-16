import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type BadgeVariant = "gold" | "outline" | "success" | "warning";

const badgeStyles: Record<BadgeVariant, string> = {
  gold: "bg-gold text-forest",
  outline: "border border-forest bg-transparent text-forest",
  success: "bg-success text-cream",
  warning: "bg-warning text-forest",
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

/**
 * Compact badge / pill — DESIGN-SYSTEM §7.7.
 */
export function Badge({ variant = "outline", className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-3 text-[11px] font-semibold uppercase tracking-wide",
        badgeStyles[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

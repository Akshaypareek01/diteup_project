import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primaryForest" | "primaryGold" | "secondary" | "secondaryCream" | "ghost";

export type ButtonSize = "sm" | "md" | "lg" | "xl";

const variantClass: Record<ButtonVariant, string> = {
  primaryForest: "bg-forest text-cream hover:brightness-[1.04] shadow-sm hover:shadow-md border border-transparent",
  primaryGold:
    "bg-gold text-forest hover:bg-gold-soft shadow-glow-gold border border-transparent",
  secondary: "bg-transparent text-forest border border-forest hover:bg-paper",
  secondaryCream: "bg-transparent text-cream border border-cream/40 hover:border-gold hover:text-gold",
  ghost: "bg-transparent text-forest hover:bg-beige/60 border border-transparent",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3.5 text-body-sm font-semibold",
  md: "h-11 px-5 text-button font-semibold uppercase tracking-wide",
  lg: "h-[52px] px-8 text-button font-semibold uppercase tracking-wide",
  xl: "h-[60px] px-9 text-[17px] font-semibold uppercase tracking-wide",
};

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  href?: string;
  className?: string;
  children: ReactNode;
  onClick?: ButtonHTMLAttributes<HTMLButtonElement>["onClick"];
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children" | "onClick">;

const baseClass =
  "inline-flex items-center justify-center rounded-lg text-center transition duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream disabled:opacity-50 disabled:pointer-events-none";

/**
 * Accessible button / internal link with design-system variants (DESIGN-SYSTEM §7.1).
 */
export function Button({
  variant = "primaryForest",
  size = "md",
  href,
  className,
  children,
  type = "button",
  onClick,
  ...rest
}: ButtonProps) {
  const cls = cn(baseClass, variantClass[variant], sizeClass[size], className);

  if (href) {
    return (
      <Link
        href={href}
        className={cls}
        onClick={onClick as unknown as MouseEventHandler<HTMLAnchorElement>}
      >
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} onClick={onClick} {...rest}>
      {children}
    </button>
  );
}

import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "dark";
};

/**
 * Paper or dark-on-forest surface — DESIGN-SYSTEM §7.6.
 */
export function Card({
  variant = "default",
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-6 md:p-8 shadow-sm",
        variant === "default" && "border-line bg-paper",
        variant === "dark" && "border-line-dark bg-sage text-cream",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

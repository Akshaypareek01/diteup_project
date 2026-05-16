import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type TagProps = HTMLAttributes<HTMLSpanElement>;

/**
 * Ingredient-style pill — DESIGN-SYSTEM §7.8.
 */
export function Tag({ className, children, ...rest }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-beige px-3 py-1 text-body-sm font-medium text-forest",
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  );
}

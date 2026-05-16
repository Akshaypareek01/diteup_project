const sizePx = {
  sm: 20,
  md: 24,
  lg: 36,
  xl: 60,
  touch: 44,
} as const;

export type IconPlaceholderSize = keyof typeof sizePx;

export type IconPlaceholderProps = {
  /** Describes the icon that will replace this slot (e.g. “High protein”) */
  label: string;
  size?: IconPlaceholderSize;
  /** If true — circular chip (ingredient grid, trust strip) */
  rounded?: "square" | "circle";
  className?: string;
};

/**
 * Placeholder for Lucide/custom SVG icons. Default 24×24 per design-system iconography.
 */
export function IconPlaceholder({
  label,
  size = "md",
  rounded = "square",
  className = "",
}: IconPlaceholderProps) {
  const px = sizePx[size];
  const roundedClass = rounded === "circle" ? "rounded-full" : "rounded-sm";
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className={`inline-flex shrink-0 items-center justify-center border border-line-dark/25 bg-sage/30 ${roundedClass} ${className}`}
      style={{ width: px, height: px }}
    />
  );
}

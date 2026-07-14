import { cn } from "@/lib/utils";

export type MediaPlaceholderAspect = "9/16" | "1/1" | "16/9" | "4/3";

const aspectClass: Record<MediaPlaceholderAspect, string> = {
  "9/16": "aspect-[9/16]",
  "1/1": "aspect-square",
  "16/9": "aspect-video",
  "4/3": "aspect-[4/3]",
};

export type MediaPlaceholderProps = {
  /** Human-readable label shown inside the placeholder. */
  label: string;
  /** Aspect ratio preset for the slot. */
  aspect?: MediaPlaceholderAspect;
  className?: string;
};

/**
 * Black-background media slot for graphics, reels, badges, or review photos
 * until final assets are supplied by the client.
 */
export function MediaPlaceholder({ label, aspect = "16/9", className }: MediaPlaceholderProps) {
  return (
    <div
      role="img"
      aria-label={`${label} — media placeholder`}
      className={cn(
        "grid w-full place-items-center rounded-xl border border-dashed border-cream/25 bg-black text-center",
        aspectClass[aspect],
        className,
      )}
    >
      <span className="px-3 font-sans text-body-sm font-medium text-cream/70">{label}</span>
    </div>
  );
}

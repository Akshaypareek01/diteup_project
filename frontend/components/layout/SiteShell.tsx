import type { ReactNode } from "react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";

export type SiteShellProps = {
  children: ReactNode;
  headerVariant?: "default" | "compact";
  showFooter?: boolean;
};

/**
 * Public marketing shell: skip link, sticky header, optional footer.
 */
export function SiteShell({
  children,
  headerVariant = "default",
  showFooter = true,
}: SiteShellProps) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-sm focus:bg-gold focus:px-3 focus:py-2 focus:text-forest"
      >
        Skip to content
      </a>
      <SiteHeader variant={headerVariant} />
      <main id="main">{children}</main>
      {showFooter ? <SiteFooter /> : null}
    </>
  );
}

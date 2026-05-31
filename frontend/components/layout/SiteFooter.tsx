import Image from "next/image";
import Link from "next/link";
import { buildPrimaryNavLinks } from "@/components/layout/site-nav-links";
import { resolveShopNavHref } from "@/lib/resolve-shop-nav-href";

const POLICY_LINKS = [
  { href: "/shipping-policy", label: "Shipping Policy" },
  { href: "/refund-policy", label: "Return & Refund" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms & Conditions" },
] as const;

const SOCIAL_LINKS = [
  { label: "Instagram", href: "https://www.instagram.com/" },
  { label: "Facebook", href: "https://www.facebook.com/" },
  { label: "YouTube", href: "https://www.youtube.com/" },
] as const;

/** Outline envelope icon — inherits `currentColor`. */
function IconMail({ className }: { className?: string }) {
  return (
    <svg className={className} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 6h16v12H4V6z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <path d="M4 7l8 6 8-6" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Map pin outline — inherits `currentColor`. */
function IconPin({ className }: { className?: string }) {
  return (
    <svg className={className} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-5.6 7-11a7 7 0 10-14 0c0 5.4 7 11 7 11z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <circle cx={12} cy={10} r={2} stroke="currentColor" strokeWidth={1.35} />
    </svg>
  );
}

/** Minimal Instagram glyph inside circular outline button. */
function IconInstagramGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x={4} y={4} width={16} height={16} rx={4} stroke="currentColor" strokeWidth={1.35} />
      <circle cx={12} cy={12} r={3.25} stroke="currentColor" strokeWidth={1.35} />
      <circle cx={16.5} cy={7.5} r={0.75} fill="currentColor" />
    </svg>
  );
}

/** Minimal Facebook “f” stroke. */
function IconFacebookGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 8h-2a1 1 0 00-1 1v2h3l-.5 3H12v8H9v-8H7v-3h2V9a4 4 0 014-4h4v3z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** YouTube play rectangle outline. */
function IconYoutubeGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12s-.5 3.5-1 4a2 2 0 01-1.4.9C17 17 12 17 12 17s-5 0-6.6-.1A2 2 0 014 16c-.5-.5-1-4-1-4s-.5-3.5 1-4c.6-.6 1.7-.9 6-.9h6c4.3 0 5.4.3 6 .9 1 .5 1 4 1 4z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <path d="M10 10l5 2-5 2v-4z" fill="currentColor" />
    </svg>
  );
}

const SOCIAL_ICONS = [IconInstagramGlyph, IconFacebookGlyph, IconYoutubeGlyph] as const;

/**
 * Cream marketing footer: brand + socials, quick links, policies, contact, copyright rail.
 */
export async function SiteFooter() {
  const year = new Date().getFullYear();
  const shopHref = await resolveShopNavHref();
  const navLinks = buildPrimaryNavLinks(shopHref);

  return (
    <footer className="border-t border-line/80 bg-[#FDFBF7] text-ink">
      <div className="mx-auto max-w-[1320px] px-5 py-14 md:px-8 md:py-16 lg:px-12">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="relative mb-5 inline-block h-12 w-44 md:h-14 md:w-48" aria-label="DiteUp home">
              <Image src="/assets/logos/logo_light.png" alt="" fill className="object-contain object-left" />
            </Link>
            <p className="max-w-xs font-sans text-body-sm leading-relaxed text-ink-soft">
              Real ingredients. Real nutrition.
              <br />
              Elevate your everyday with clean, smart fuel.
            </p>
            <div className="mt-6 flex flex-wrap gap-3" aria-label="Social links">
              {SOCIAL_LINKS.map((s, i) => {
                const Glyph = SOCIAL_ICONS[i];
                return (
                  <Link
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex size-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-forest/35 hover:bg-beige/70 hover:text-forest"
                    aria-label={s.label}
                  >
                    <Glyph />
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="font-sans text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-ink">
              Quick links
            </h2>
            <ul className="mt-4 space-y-2.5 font-sans text-body-sm text-ink-soft">
              {navLinks.map((l) => (
                <li key={`${l.label}-${l.href}`}>
                  <Link href={l.href} className="transition-colors hover:text-forest">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-sans text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-ink">
              Policies
            </h2>
            <ul className="mt-4 space-y-2.5 font-sans text-body-sm text-ink-soft">
              {POLICY_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-forest">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-sans text-[0.8125rem] font-bold uppercase tracking-[0.12em] text-ink">
              Contact us
            </h2>
            <address className="mt-4 space-y-3 font-sans text-body-sm not-italic leading-snug text-ink-soft">
              <p className="flex items-start gap-3">
                <IconMail className="mt-0.5 shrink-0 text-forest/85" aria-hidden />
                <a href="mailto:info@diteup.com" className="transition-colors hover:text-forest">
                  info@diteup.com
                </a>
              </p>
              <p className="flex items-start gap-3">
                <IconPin className="mt-0.5 shrink-0 text-forest/85" aria-hidden />
                <span>India</span>
              </p>
            </address>
          </div>
        </div>
      </div>

      <div className="border-t border-line/70">
        <div className="mx-auto max-w-[1320px] px-5 py-5 md:px-8 lg:px-12">
          <p className="font-sans text-body-sm text-ink-muted">
            © {year} DiteUp. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

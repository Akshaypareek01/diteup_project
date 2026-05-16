import Image from "next/image";
import Link from "next/link";
import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";

const quick = [
  { href: "/#ingredients", label: "Ingredients" },
  { href: "/product/energy-bite", label: "Shop" },
  { href: "/contact", label: "Contact" },
];

const policies = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund-policy", label: "Refund" },
  { href: "/shipping-policy", label: "Shipping" },
];

/**
 * Forest footer with link columns and social icon placeholders.
 */
export function SiteFooter() {
  return (
    <footer className="bg-forest text-cream">
      <div className="mx-auto max-w-[1320px] px-5 py-12 md:px-8 lg:grid lg:grid-cols-[1.2fr_1fr_1fr_1fr] lg:gap-10 lg:px-12">
        <div className="mb-8 lg:mb-0">
          <div className="relative mb-4 h-10 w-36 opacity-95">
            <Image
              src="/assets/logos/diteup-logo.svg"
              alt=""
              fill
              className="object-contain object-left brightness-0 invert"
            />
          </div>
          <p className="max-w-xs text-body-sm text-cream/80">
            Clean nutrition. Zero hassle. Replace hero and product photography when assets land.
          </p>
          <div className="mt-4 flex gap-3" aria-label="Social links">
            {["Instagram", "Facebook", "YouTube"].map((s) => (
              <span
                key={s}
                className="inline-flex size-10 items-center justify-center rounded-full border border-line-dark/50"
                title={s}
              >
                <IconPlaceholder label={`${s} icon`} size="sm" rounded="circle" />
              </span>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-mono text-eyebrow text-gold">Quick links</h2>
          <ul className="mt-3 space-y-2 text-body-sm">
            {quick.map((l) => (
              <li key={l.href}>
                <Link className="hover:underline" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-eyebrow text-gold">Policies</h2>
          <ul className="mt-3 space-y-2 text-body-sm">
            {policies.map((l) => (
              <li key={l.href}>
                <Link className="hover:underline" href={l.href}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-eyebrow text-gold">Contact</h2>
          <address className="mt-3 space-y-1 text-body-sm not-italic text-cream/85">
            <p>support@diteup.com</p>
            <p>FSSAI license placeholder</p>
          </address>
          <div
            className="mt-4 flex items-center gap-2"
            role="img"
            aria-label="FSSAI logo placeholder"
          >
            <IconPlaceholder label="FSSAI logo" size="lg" />
            <span className="text-body-sm text-cream/70">FSSAI № ______</span>
          </div>
        </div>
      </div>
      <div className="border-t border-line-dark/60 py-4 text-center text-body-sm text-cream/60">
        © {new Date().getFullYear()} DiteUp
      </div>
    </footer>
  );
}

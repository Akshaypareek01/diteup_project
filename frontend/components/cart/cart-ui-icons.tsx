import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

/**
 * Remove-line control: trash can outline (cart item card).
 */
export function CartIconTrash({ className, ...rest }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...rest}
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14zM10 11v6M14 11v6" />
    </svg>
  );
}

/**
 * Trust row: secure payments lock.
 */
export function CartIconLock({ className, ...rest }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.75" {...rest}>
      <path
        d="M7 11V8a5 5 0 0 1 10 0v3"
        strokeLinecap="round"
      />
      <rect x="5" y="11" width="14" height="10" rx="2" strokeLinejoin="round" />
      <path d="M12 15v2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Trust row: cash on delivery indicator.
 */
export function CartIconCod({ className, ...rest }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.75" {...rest}>
      <rect x="3" y="6" width="18" height="12" rx="2" strokeLinejoin="round" />
      <path d="M7 10h.01M17 14h.01" strokeLinecap="round" />
      <path d="M12 10c1.66 0 3 1 3 2s-1.34 2-3 2-3-1-3-2 1.34-2 3-2z" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Free-shipping progress: small star marker at end of fill (mock-aligned).
 */
export function CartIconStarBadge({ className, ...rest }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
      <path d="M12 2.75 14.74 9.14h6.93l-5.61 4.06 2.13 6.59L12 16.93l-5.18 3.87 2.13-6.59L3.34 9.14h6.93L12 2.75z" />
    </svg>
  );
}

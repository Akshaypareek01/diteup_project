import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-5 text-center">
      <h1 className="font-display text-display-xl font-semibold text-forest">404</h1>
      <p className="mt-2 max-w-md text-body text-ink-soft">This page does not exist.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center rounded-lg bg-gold px-8 font-sans text-button font-semibold uppercase text-forest"
      >
        Home
      </Link>
    </div>
  );
}

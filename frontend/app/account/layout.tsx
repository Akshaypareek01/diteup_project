import Link from "next/link";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-user";

const links = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/profile", label: "Profile" },
  { href: "/account/reviews/new", label: "Write a review" },
];

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?next=/account");
  }
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-[1080px] flex-wrap gap-2 px-4 py-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-line bg-cream px-4 py-2 text-body-sm font-medium text-forest hover:border-forest"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
      <div className="mx-auto max-w-[1080px] px-4 py-8">{children}</div>
    </div>
  );
}

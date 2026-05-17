import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AccountAreaHeader } from "@/components/account/AccountAreaHeader";
import { getAuthUser } from "@/lib/auth-user";
import { resolveShopNavHref } from "@/lib/resolve-shop-nav-href";

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login?next=/account");
  }
  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const shopHref = await resolveShopNavHref();

  return (
    <div className="min-h-screen bg-cream">
      <AccountAreaHeader shopHref={shopHref} />
      <main className="mx-auto max-w-[1080px] px-4 py-6 sm:px-5 sm:py-8 md:py-10">{children}</main>
    </div>
  );
}

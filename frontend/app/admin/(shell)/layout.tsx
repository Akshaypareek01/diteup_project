import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { assertAdmin, getAdminUser } from "@/lib/admin-session";

export default async function AdminConsoleLayout({ children }: { children: ReactNode }) {
  const user = await getAdminUser();
  if (!assertAdmin(user)) {
    redirect("/admin/login?next=/admin");
  }
  return <AdminShell user={user}>{children}</AdminShell>;
}

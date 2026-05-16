import type { ReactNode } from "react";
import type { AdminUser } from "@/lib/admin-session";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export type AdminShellProps = {
  user: AdminUser;
  children: ReactNode;
};

/**
 * Admin chrome — cream-dominant shell per DESIGN-SYSTEM §10.5 / §7 inverted hierarchy.
 */
export function AdminShell({ user, children }: AdminShellProps) {
  return (
    <div className="flex min-h-screen bg-cream text-ink">
      <AdminSidebar />
      <div id="admin-main" className="flex min-h-screen min-w-0 flex-1 flex-col">
        <AdminTopbar user={user} />
        <main className="flex-1 overflow-auto p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}

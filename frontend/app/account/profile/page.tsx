import { redirect } from "next/navigation";

/**
 * Preserves bookmarks and external links to the legacy profile URL.
 */
export default function AccountProfileLegacyRedirect() {
  redirect("/account");
}

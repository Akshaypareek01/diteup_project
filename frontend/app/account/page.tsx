import { serverApiFetch } from "@/lib/server-api";

export default async function AccountHomePage() {
  const res = await serverApiFetch("/v1/me/profile");
  if (!res.ok) {
    return <p className="text-body text-error">Could not load profile.</p>;
  }
  const data = (await res.json()) as { profile?: { name?: string | null; email?: string } };
  const profile = data.profile;

  return (
    <>
      <h1 className="font-display text-display-md font-semibold text-forest">Account</h1>
      <p className="mt-2 max-w-xl text-body text-ink-soft">
        Signed in as <span className="font-medium text-forest">{profile?.email ?? "—"}</span>
        {profile?.name ? ` (${profile.name})` : ""}.
      </p>
      <div
        className="mt-8 flex size-24 items-center justify-center rounded-full border-2 border-dashed border-line bg-paper text-body-sm text-ink-muted"
        aria-label="Profile image placeholder"
      >
        96×96
      </div>
    </>
  );
}

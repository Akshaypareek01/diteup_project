import { ProfileEditForm, type ProfileSnapshot } from "@/components/account/ProfileEditForm";
import { AvatarUploader } from "@/components/account/AvatarUploader";
import { EmailChangeFlow } from "@/components/account/EmailChangeFlow";
import { DeleteAccountPanel } from "@/components/account/DeleteAccountPanel";
import { serverApiFetch } from "@/lib/server-api";

/**
 * Account landing: full profile editing (former “overview” replaced by this view).
 */
export default async function AccountHomePage() {
  const res = await serverApiFetch("/v1/me/profile");
  if (!res.ok) {
    return <p className="text-body text-error">Could not load profile.</p>;
  }
  const data = (await res.json()) as { profile?: ProfileSnapshot };
  const p = data.profile;
  if (!p?.email) {
    return <p className="text-body text-error">Could not load profile.</p>;
  }

  const initialLike: ProfileSnapshot = {
    name: p.name,
    email: p.email,
    phone: p.phone,
    gender: p.gender,
    dateOfBirth: p.dateOfBirth ? String(p.dateOfBirth).slice(0, 10) : null,
    marketingOptIn: p.marketingOptIn,
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <h1 className="font-display text-display-md font-semibold text-forest">Profile</h1>
      <dl className="mt-6 max-w-md space-y-3 text-body-sm">
        <div>
          <dt className="font-mono text-eyebrow text-ink-muted">Email</dt>
          <dd className="mt-1 text-forest">{p.email}</dd>
        </div>
      </dl>
      <AvatarUploader currentUrl={p.profileImageUrl} />
      <ProfileEditForm initial={initialLike} />
      <EmailChangeFlow initialEmail={p.email} />
      <DeleteAccountPanel />
    </div>
  );
}

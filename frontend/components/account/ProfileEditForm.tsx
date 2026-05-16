"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Toggle } from "@/components/ui/Toggle";
import { ApiError, clientApiJson } from "@/lib/client-api";

export type ProfileSnapshot = {
  name?: string | null;
  email?: string;
  phone?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  marketingOptIn?: boolean;
  profileImageUrl?: string | null;
};

type ProfileResponse = { profile: ProfileSnapshot };

/**
 * Updates profile fields — `PATCH /v1/me/profile`.
 */
export function ProfileEditForm({ initial }: { initial: ProfileSnapshot }) {
  const router = useRouter();
  const [name, setName] = useState(initial.name ?? "");
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [gender, setGender] = useState(initial.gender ?? "");
  const [dob, setDob] = useState(() => {
    const raw = initial.dateOfBirth;
    if (!raw) return "";
    if (raw.length >= 10) return raw.slice(0, 10);
    return raw;
  });
  const [marketingOptIn, setMarketingOptIn] = useState(Boolean(initial.marketingOptIn));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setBusy(true);
    try {
      const body: Record<string, unknown> = {
        marketingOptIn,
      };
      body.name = name.trim() === "" ? null : name.trim();
      body.phone = phone.trim() === "" ? null : phone.trim();
      if (gender) body.gender = gender;
      body.dateOfBirth = dob.trim() === "" ? null : dob.trim();

      await clientApiJson<ProfileResponse>("/v1/me/profile", {
        method: "PATCH",
        json: body,
      });
      setOk(true);
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not save profile.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-8 max-w-md space-y-4" onSubmit={save} aria-label="Edit profile">
      <p className="text-body-sm text-ink-muted">
        Signed in as <span className="font-medium text-forest">{initial.email}</span> — email changes use a separate
        secure flow in the app API.
      </p>
      <Input label="Name" name="name" value={name} onChange={(ev) => setName(ev.target.value)} />
      <Input label="Phone (India)" name="phone" value={phone} onChange={(ev) => setPhone(ev.target.value)} />
      <div>
        <Select label="Gender" name="gender" value={gender} onChange={(ev) => setGender(ev.target.value)}>
          <option value="">Prefer not to say</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
          <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
        </Select>
      </div>
      <div>
        <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted" htmlFor="dob">
          Date of birth
        </label>
        <input
          id="dob"
          name="dateOfBirth"
          type="date"
          value={dob}
          onChange={(ev) => setDob(ev.target.value)}
          className="h-12 w-full rounded-lg border border-line bg-paper px-3 text-body outline-none focus:border-forest"
        />
      </div>
      <Toggle label="Marketing emails" checked={marketingOptIn} onCheckedChange={setMarketingOptIn} />
      {err ? (
        <p className="text-body-sm text-error" role="alert">
          {err}
        </p>
      ) : null}
      {ok ? (
        <p className="text-body-sm text-success" role="status">
          Profile updated.
        </p>
      ) : null}
      <Button type="submit" variant="primaryGold" size="md" disabled={busy}>
        {busy ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}

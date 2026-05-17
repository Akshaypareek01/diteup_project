"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, clientApiJson } from "@/lib/client-api";

export type MeAddressRow = {
  id: string;
  label?: string | null;
  name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
  country: string;
  isDefault?: boolean;
};

type AddressesBookClientProps = {
  initialAddresses: MeAddressRow[];
};

const emptyDraft = (): Record<string, string> => ({
  label: "",
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "IN",
});

function rowToDraft(a: MeAddressRow): Record<string, string> {
  return {
    label: a.label ?? "",
    name: a.name,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? "",
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    country: a.country || "IN",
  };
}

/**
 * Address CRUD wired to `/v1/me/addresses*` (REST).
 */
export function AddressesBookClient({ initialAddresses }: AddressesBookClientProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialAddresses);
  const [draft, setDraft] = useState<Record<string, string>>(emptyDraft());
  const [editingId, setEditingId] = useState<string | null>("new");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function reloadFromApi() {
    const pack = await clientApiJson<{ addresses?: MeAddressRow[] }>(`/v1/me/addresses`);
    setRows(pack.addresses ?? []);
  }

  async function mutateAndRefresh(action: () => Promise<void>) {
    setErr(null);
    setBusy(true);
    try {
      await action();
      await reloadFromApi();
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  function openNew() {
    setEditingId("new");
    setDraft(emptyDraft());
    setErr(null);
  }

  function openEdit(a: MeAddressRow) {
    setEditingId(a.id);
    setDraft(rowToDraft(a));
    setErr(null);
  }

  async function saveForm(e: React.FormEvent) {
    e.preventDefault();
    const body = {
      label: draft.label.trim() || undefined,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      line1: draft.line1.trim(),
      line2: draft.line2.trim() || undefined,
      city: draft.city.trim(),
      state: draft.state.trim(),
      pincode: draft.pincode.trim(),
      country: draft.country.trim() || "IN",
      isDefault: rows.length === 0,
    };
    if (editingId === "new") {
      await mutateAndRefresh(async () => {
        await clientApiJson<{ address: MeAddressRow }>(`/v1/me/addresses`, {
          method: "POST",
          json: body,
        });
      });
      setDraft(emptyDraft());
      return;
    }
    await mutateAndRefresh(async () => {
      await clientApiJson<{ address: MeAddressRow }>(`/v1/me/addresses/${encodeURIComponent(editingId!)}`, {
        method: "PATCH",
        json: body,
      });
    });
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this address?")) return;
    await mutateAndRefresh(async () => {
      await clientApiJson(`/v1/me/addresses/${encodeURIComponent(id)}`, { method: "DELETE" });
    });
    if (editingId === id) openNew();
  }

  async function makeDefault(id: string) {
    await mutateAndRefresh(async () => {
      await clientApiJson(`/v1/me/addresses/${encodeURIComponent(id)}/default`, { method: "POST" });
    });
  }

  return (
    <>
      <h1 className="font-display text-display-md font-semibold text-forest">Addresses</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="addr-list-heading">
          <h2 id="addr-list-heading" className="font-mono text-eyebrow text-ink-muted">
            Saved
          </h2>
          {rows.length === 0 ? (
            <p className="mt-4 text-body text-ink-soft">No saved addresses yet.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {rows.map((a) => (
                <li key={a.id} className="rounded-lg border border-line bg-paper p-4 text-body-sm shadow-sm sm:p-5">
                  {a.isDefault ? (
                    <span className="mb-2 inline-block rounded-full bg-gold/30 px-2 py-0.5 font-mono text-eyebrow text-forest">
                      Default
                    </span>
                  ) : null}
                  <p className="break-words font-semibold text-forest">{a.name}</p>
                  <p className="break-words text-ink-muted">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.pincode}
                  </p>
                  <p className="mt-1 text-ink-soft">{a.phone}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" className="text-body-sm font-semibold text-gold-deep underline" onClick={() => openEdit(a)}>
                      Edit
                    </button>
                    {!a.isDefault ? (
                      <button
                        type="button"
                        className="text-body-sm font-semibold text-forest underline"
                        onClick={() => void makeDefault(a.id)}
                        disabled={busy}
                      >
                        Set default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="text-body-sm font-semibold text-error underline"
                      onClick={() => void remove(a.id)}
                      disabled={busy}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-line bg-paper p-4 sm:p-6" aria-labelledby="addr-form-heading">
          <h2 id="addr-form-heading" className="font-semibold text-forest">
            {editingId === "new" ? "Add address" : "Edit address"}
          </h2>
          <button type="button" className="mt-2 text-body-sm font-semibold text-gold-deep underline" onClick={openNew}>
            + New address instead
          </button>
          <form className="mt-6 space-y-3" onSubmit={(e) => void saveForm(e)} aria-label={editingId === "new" ? "New address form" : "Edit address form"}>
            <Input label="Label (optional)" name="label" value={draft.label} onChange={(ev) => setDraft((d) => ({ ...d, label: ev.target.value }))} />
            <Input label="Full name" name="name" value={draft.name} onChange={(ev) => setDraft((d) => ({ ...d, name: ev.target.value }))} required />
            <Input label="Phone" name="phone" type="tel" value={draft.phone} onChange={(ev) => setDraft((d) => ({ ...d, phone: ev.target.value }))} required />
            <Input label="Line 1" name="line1" value={draft.line1} onChange={(ev) => setDraft((d) => ({ ...d, line1: ev.target.value }))} required />
            <Input label="Line 2" name="line2" value={draft.line2} onChange={(ev) => setDraft((d) => ({ ...d, line2: ev.target.value }))} />
            <Input label="City" name="city" value={draft.city} onChange={(ev) => setDraft((d) => ({ ...d, city: ev.target.value }))} required />
            <Input label="State" name="state" value={draft.state} onChange={(ev) => setDraft((d) => ({ ...d, state: ev.target.value }))} required />
            <Input
              label="PIN"
              name="pincode"
              inputMode="numeric"
              maxLength={6}
              value={draft.pincode}
              onChange={(ev) => setDraft((d) => ({ ...d, pincode: ev.target.value }))}
              required
            />
            <Input label="Country" name="country" value={draft.country} onChange={(ev) => setDraft((d) => ({ ...d, country: ev.target.value }))} required />
            {err ? (
              <p className="text-body-sm text-error" role="alert">
                {err}
              </p>
            ) : null}
            <Button type="submit" variant="primaryGold" disabled={busy}>
              {busy ? "Saving…" : editingId === "new" ? "Save address" : "Update address"}
            </Button>
          </form>
        </section>
      </div>
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { productEditorTabs } from "@/lib/admin-nav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";

export type ProductEditorProps = {
  productId: string;
};

/**
 * Twelve-tab product editor shell — PRD §7.7. Wire each tab to admin product APIs.
 */
export function ProductEditor({ productId }: ProductEditorProps) {
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = productEditorTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl! : "basics";
  const [tab, setTab] = useState(initialTab);

  const title = useMemo(() => productEditorTabs.find((t) => t.id === tab)?.label ?? tab, [tab]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-body-sm text-ink-muted">Product · {productId}</p>
          <h1 className="font-display text-display-md font-semibold text-forest">Editor</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="md" type="button">
            Save draft
          </Button>
          <Button variant="primaryForest" size="md" type="button">
            Publish
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row">
        <nav
          className="flex shrink-0 flex-row flex-wrap gap-1 lg:w-52 lg:flex-col lg:flex-nowrap"
          aria-label="Product editor sections"
        >
          {productEditorTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-body-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-beige text-forest shadow-sm"
                  : "text-ink-soft hover:bg-paper hover:text-forest",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <Card className="min-w-0 flex-1">
          <h2 className="font-semibold text-forest">{title}</h2>
          <p className="mt-1 text-body-sm text-ink-muted">
            Placeholder fields — replace with controlled form + API per tab.
          </p>
          <div className="mt-6 space-y-4">{tab === "basics" ? <BasicsFields /> : <GenericTabCopy tab={tab} />}</div>
        </Card>
      </div>

      <Link href="/admin/products" className="text-body-sm text-gold-deep hover:underline">
        ← Products
      </Link>
    </div>
  );
}

function BasicsFields() {
  return (
    <>
      <Input label="Name" name="name" defaultValue="Energy Bite" />
      <Input label="Slug" name="slug" defaultValue="energy-bite" />
      <div>
        <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted">
          Long description
        </label>
        <textarea
          className="min-h-[120px] w-full rounded-sm border border-line bg-paper p-3 text-body"
          placeholder="Markdown editor placeholder"
        />
      </div>
      <Select label="Badge" name="badge" defaultValue="none">
        <option value="none">None</option>
        <option value="bestseller">Bestseller</option>
        <option value="sale">Sale</option>
      </Select>
    </>
  );
}

function GenericTabCopy({ tab }: { tab: string }) {
  return (
    <p className="text-body text-ink-soft">
      Tab <code className="font-mono text-sm">{tab}</code> — configure fields per PRD §7.7.
    </p>
  );
}

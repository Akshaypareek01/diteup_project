import type { ReactNode } from "react";

type JsonLdScriptProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

/**
 * Renders schema.org JSON-LD for crawlers (trusted server-built data only).
 */
export function JsonLdScript({ data }: JsonLdScriptProps): ReactNode {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

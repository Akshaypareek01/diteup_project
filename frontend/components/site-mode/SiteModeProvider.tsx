"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchSiteModeClient } from "@/lib/client-site-mode";
import { INACTIVE_SITE_MODE, type PublicSiteMode } from "@/lib/types/site-mode";

type SiteModeContextValue = {
  siteMode: PublicSiteMode;
  /** Re-fetch from API (e.g. after countdown expires). */
  refreshSiteMode: () => Promise<void>;
  loading: boolean;
};

const SiteModeContext = createContext<SiteModeContextValue>({
  siteMode: INACTIVE_SITE_MODE,
  refreshSiteMode: async () => {},
  loading: true,
});

export type SiteModeProviderProps = {
  children: ReactNode;
  /** Optional SSR seed — client fetch always runs after mount for fresh data. */
  initialSiteMode?: PublicSiteMode;
};

/**
 * Provides live site-wide mode from `/v1/site/mode` — avoids build-time/static SSR staleness.
 */
export function SiteModeProvider({ children, initialSiteMode }: SiteModeProviderProps) {
  const [siteMode, setSiteMode] = useState<PublicSiteMode>(initialSiteMode ?? INACTIVE_SITE_MODE);
  const [loading, setLoading] = useState(true);

  const refreshSiteMode = useCallback(async () => {
    const next = await fetchSiteModeClient();
    setSiteMode(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshSiteMode();
  }, [refreshSiteMode]);

  const value = useMemo(
    () => ({ siteMode, refreshSiteMode, loading }),
    [siteMode, refreshSiteMode, loading],
  );

  return <SiteModeContext.Provider value={value}>{children}</SiteModeContext.Provider>;
}

/**
 * Reads current site mode from context (client-only live fetch after hydration).
 */
export function useSiteMode(): SiteModeContextValue {
  return useContext(SiteModeContext);
}

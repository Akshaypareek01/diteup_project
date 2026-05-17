"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "diteup:hero-banner-light";

export type HeroBannerVariantContextValue = {
  useLightBanner: boolean;
  setUseLightBanner: (next: boolean) => void;
  toggleLightBanner: () => void;
};

const HeroBannerVariantContext = createContext<HeroBannerVariantContextValue | null>(
  null,
);

/**
 * Persists hero artwork preference to `localStorage` when supported.
 * @param useLight - When true, store the light-banner flag.
 */
function persistLightPreference(useLight: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, useLight ? "1" : "0");
  } catch (err) {
    console.warn("Hero banner preference could not be saved", err);
  }
}

/**
 * Supplies shared state for default vs. light hero banner images on the home page.
 */
export function HeroBannerVariantProvider({ children }: { children: ReactNode }) {
  const [useLightBanner, setUseLightBannerState] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw === "1") setUseLightBannerState(true);
    } catch (err) {
      console.warn("Hero banner preference could not be read", err);
    }
  }, []);

  const setUseLightBanner = useCallback((next: boolean) => {
    setUseLightBannerState(next);
    persistLightPreference(next);
  }, []);

  const toggleLightBanner = useCallback(() => {
    setUseLightBannerState((prev) => {
      const next = !prev;
      persistLightPreference(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ useLightBanner, setUseLightBanner, toggleLightBanner }),
    [useLightBanner, setUseLightBanner, toggleLightBanner],
  );

  return (
    <HeroBannerVariantContext.Provider value={value}>
      {children}
    </HeroBannerVariantContext.Provider>
  );
}

/**
 * @returns Hero banner variant controls from the nearest provider.
 */
export function useHeroBannerVariant(): HeroBannerVariantContextValue {
  const ctx = useContext(HeroBannerVariantContext);
  if (!ctx) {
    throw new Error("useHeroBannerVariant must be used within HeroBannerVariantProvider");
  }
  return ctx;
}

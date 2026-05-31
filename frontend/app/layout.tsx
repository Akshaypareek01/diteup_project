import type { Metadata } from "next";
import { JetBrains_Mono, Montserrat, Playfair_Display } from "next/font/google";
import { MetaPixelGate } from "@/components/analytics/MetaPixelGate";
import { OrganizationJsonLd } from "@/components/seo/OrganizationJsonLd";
import { CookieBanner } from "@/components/legal/CookieBanner";
import { buildRootMetadata, resolveSiteSeo } from "@/lib/seo/resolve-site-seo";
import { AppProviders } from "./providers";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const montserrat = Montserrat({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

/** Admin / data UI: load after primary text to keep LCP fonts lean. */
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

/**
 * Root metadata — merges admin `siteSeo` settings with Next.js defaults.
 */
export async function generateMetadata(): Promise<Metadata> {
  const siteSeo = await resolveSiteSeo();
  return {
    ...buildRootMetadata(siteSeo),
    icons: {
      icon: [{ url: "/assets/logos/diteup-logo.svg", type: "image/svg+xml" }],
      apple: [{ url: "/assets/logos/diteup-logo.svg", type: "image/svg+xml" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteSeo = await resolveSiteSeo();

  return (
    <html
      lang="en"
      className={`${playfair.variable} ${montserrat.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">
        <OrganizationJsonLd siteSeo={siteSeo} />
        <AppProviders>
          {children}
          <MetaPixelGate />
          <CookieBanner />
        </AppProviders>
      </body>
    </html>
  );
}

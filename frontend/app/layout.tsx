import type { Metadata } from "next";
import { JetBrains_Mono, Montserrat, Playfair_Display } from "next/font/google";
import { MetaPixel } from "@/components/analytics/MetaPixel";
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

export const metadata: Metadata = {
  title: "DiteUp",
  description: "DiteUp",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${montserrat.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen bg-cream font-sans text-ink antialiased">
        <AppProviders>
          {children}
          <MetaPixel />
        </AppProviders>
      </body>
    </html>
  );
}

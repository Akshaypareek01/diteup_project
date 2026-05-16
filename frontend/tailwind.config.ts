import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: "#1F3D2E",
        sage: "#3E5C46",
        olive: "#6B7F4E",
        cream: "#F5F0E6",
        beige: "#E8DFC8",
        paper: "#FAF7EF",
        gold: { DEFAULT: "#C8A24A", soft: "#D9B968", deep: "#A8852E" },
        ink: { DEFAULT: "#0F1F18", soft: "#3A4A41", muted: "#6B7B72" },
        line: { DEFAULT: "#D9CFB8", dark: "#2A4636" },
        success: "#5C8A3A",
        warning: "#C8862A",
        error: "#A4392E",
        info: "#4A6B7F",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-montserrat)", "system-ui", "sans-serif"],
        mono: ["var(--font-jetbrains)", "ui-monospace", "monospace"],
      },
      fontSize: {
        "display-2xl": [
          "clamp(2.75rem, 4vw + 1rem, 5rem)",
          { lineHeight: "1.05", letterSpacing: "-0.02em" },
        ],
        "display-xl": [
          "clamp(2.25rem, 3vw + 1rem, 4rem)",
          { lineHeight: "1.08", letterSpacing: "-0.02em" },
        ],
        "display-lg": [
          "clamp(1.875rem, 2vw + 1rem, 3rem)",
          { lineHeight: "1.12", letterSpacing: "-0.01em" },
        ],
        "display-md": [
          "clamp(1.625rem, 1vw + 1rem, 2.25rem)",
          { lineHeight: "1.18" },
        ],
        eyebrow: [
          "0.8125rem",
          { lineHeight: "1.4", letterSpacing: "0.14em" },
        ],
        "body-lg": ["1.0625rem", { lineHeight: "1.6" }],
        body: ["0.9375rem", { lineHeight: "1.65" }],
        "body-sm": ["0.8125rem", { lineHeight: "1.55" }],
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "24px",
        "2xl": "32px",
      },
      boxShadow: {
        xs: "0 1px 2px rgba(31,61,46,0.04)",
        sm: "0 2px 6px rgba(31,61,46,0.06), 0 1px 2px rgba(31,61,46,0.04)",
        md: "0 6px 20px rgba(31,61,46,0.08), 0 2px 6px rgba(31,61,46,0.04)",
        lg: "0 16px 40px rgba(31,61,46,0.10), 0 6px 14px rgba(31,61,46,0.05)",
        "glow-gold":
          "0 0 0 1px rgba(200,162,74,0.4), 0 8px 24px rgba(200,162,74,0.25)",
      },
      backgroundImage: {
        "gradient-hero":
          "radial-gradient(120% 80% at 80% 0%, rgba(200,162,74,0.18) 0%, transparent 50%), linear-gradient(180deg, #1F3D2E 0%, #2A4636 100%)",
        "gradient-dawn":
          "linear-gradient(180deg, #1F3D2E 0%, #6B7F4E 60%, #F5F0E6 100%)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.85" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s linear infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
        float: "float 4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

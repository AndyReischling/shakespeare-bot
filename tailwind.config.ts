import type { Config } from "tailwindcss";

// Visual language inspired by the Norton Museum of Art system: warm cream/ivory
// paper, warm near-black ink, a high-contrast display serif, a tight neo-grotesque
// for bold statements, and a single vivid periwinkle used as full-bleed accent.
// Token names are kept from the original dark theme so components follow along;
// the values are re-pitched to the light editorial palette.
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stage: {
          black: "#ffffff", // app background — white gallery wall
          deep: "#f6f6f3", // header / sunken inputs
          panel: "#fbfbf9", // raised cards / panels
          edge: "#e4e4de", // hairline borders on white
          ink: "#161513", // primary text — near-black
          dim: "#4b4a45", // secondary text
          faint: "#8b8a82", // tertiary text / tracked labels
        },
        work: {
          // Norton campaign cobalt — the primary accent, used sparingly.
          light: "#2c43df", // accent fills (chosen cards, primary buttons)
          glow: "#1f33bd", // deep cobalt for accent text on white
          deep: "#2c43df", // borders / hovers
        },
        accent: {
          // The rest of the campaign palette, restrained: single small moments.
          orange: "#f2621f",
          yellow: "#ffc51f",
        },
        page: {
          // the open book — faintly warm paper against the white room
          paper: "#faf8f3",
          line: "#e9e6dc",
          text: "#1b1914",
          faint: "#8d887a",
          cite: "#1f33bd",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "Cambria", "Times New Roman", "serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      keyframes: {
        "worklight-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "book-jump": {
          "0%": { backgroundColor: "rgba(44,67,223,0.0)" },
          "30%": { backgroundColor: "rgba(44,67,223,0.16)" },
          "100%": { backgroundColor: "rgba(44,67,223,0.0)" },
        },
      },
      animation: {
        "worklight-in": "worklight-in 320ms ease-out both",
        "book-jump": "book-jump 1400ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;

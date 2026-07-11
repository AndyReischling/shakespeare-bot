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
          black: "#ece4cf", // app background — Norton cream
          deep: "#e4dbc0", // header / sunken inputs
          panel: "#f5efe0", // raised cards / panels
          edge: "#d4caae", // hairline borders on cream
          ink: "#1c1913", // primary text — warm near-black
          dim: "#4a4536", // secondary text
          faint: "#8a8069", // tertiary text / tracked labels
        },
        work: {
          // Norton periwinkle / cornflower — the one loud color.
          light: "#6b83f6", // accent fills & full-bleed blocks
          glow: "#3949c4", // deeper periwinkle for accent text that must read on cream
          deep: "#586fe6", // periwinkle for borders / hovers
        },
        page: {
          // the open book — a cleaner sheet than the room around it
          paper: "#f7f2e5",
          line: "#e4dbc4",
          text: "#221e16",
          faint: "#8a8067",
          cite: "#3949c4",
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
          "0%": { backgroundColor: "rgba(107,131,246,0.0)" },
          "30%": { backgroundColor: "rgba(107,131,246,0.28)" },
          "100%": { backgroundColor: "rgba(107,131,246,0.0)" },
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

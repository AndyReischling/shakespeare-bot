import type { Metadata } from "next";
import { Fraunces, Archivo } from "next/font/google";
import "./globals.css";

// High-contrast display serif (the wordmark voice) + tight neo-grotesque for
// bold, editorial statement type — the Norton pairing.
const serif = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  style: ["normal", "italic"],
});

const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Rehearsal Room — Shakespeare · Hamlet",
  description:
    "One avatar, one voice, three modes on one engine. A pedagogical prototype built around the moments a play refuses to answer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>{children}</body>
    </html>
  );
}

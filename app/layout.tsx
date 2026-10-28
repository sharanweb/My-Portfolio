import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import type { CSSProperties } from "react";
import "./reset.css";
import "./globals.css";
import "./fonts.css";
import { loadContent } from "@/lib/content";
import { accentInfo } from "@/lib/accent";
import { themeScript } from "@/lib/theme-script";

const sans = Geist({ subsets: ["latin"], variable: "--nf-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--nf-mono", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--nf-serif", display: "swap" });

export async function generateMetadata(): Promise<Metadata> {
  const d = await loadContent();
  return { title: d.profile.name || "Portfolio", description: d.profile.bio || undefined };
}

export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const d = await loadContent();
  const accent = accentInfo(d.theme.accent).vars as CSSProperties;
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable}`} style={accent} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript(d.theme.defaultMode) }} />
      </head>
      <body data-bg={d.theme.background || "aurora"} data-grain={d.theme.grain === false ? "off" : "on"} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

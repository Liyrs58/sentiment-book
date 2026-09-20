import type { Metadata } from "next";
import { IBM_Plex_Mono, Libre_Franklin, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const libre = Libre_Franklin({
  subsets: ["latin"],
  variable: "--font-libre",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sentiment Book",
  description:
    "HARLF/FinBERT research desk: sample news corpus scored into sentiment features, constrained 14-asset book, walk-forward backtest.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${libre.variable} ${sourceSerif.variable} ${plexMono.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

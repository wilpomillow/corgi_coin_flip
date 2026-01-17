import type { Metadata } from "next";
import "./globals.css";
import { Space_Grotesk } from "next/font/google";

const space = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space",
});

export const metadata: Metadata = {
  title: "Corgi Coin Flip",
  description: "Flip a corgi coin flip.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={space.variable}>
      <body className="font-[var(--font-space)] antialiased">{children}</body>
    </html>
  );
}

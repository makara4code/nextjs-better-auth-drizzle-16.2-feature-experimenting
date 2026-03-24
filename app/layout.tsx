import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Next 16 Starter",
  description:
    "A minimal Next.js 16 starter with the App Router, Tailwind CSS, Biome, and React Compiler enabled.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", inter.variable)}
    >
      <body className="min-h-full bg-background text-foreground font-sans">
        <a
          href="#main-content"
          className="sr-only absolute left-4 top-4 z-50 rounded-full bg-black px-4 py-2 text-sm font-medium text-white shadow-lg focus:not-sr-only focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:bg-white dark:text-black dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
        >
          Skip to main content
        </a>
        <div className="flex min-h-full flex-col">{children}</div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import Nav from "@/components/nav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PadelFlow", template: "%s | PadelFlow" },
  description: "The social platform for padel players — book courts, track scores, find coaches.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://padelflow.com"),
  openGraph: {
    title: "PadelFlow",
    description: "The social platform for padel players.",
    siteName: "PadelFlow",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="min-h-screen bg-gray-50 dark:bg-gray-950 antialiased">
          <Nav />
          <main className="max-w-6xl mx-auto px-4 py-6 sm:py-8">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}

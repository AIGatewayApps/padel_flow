import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "PadelFlow", template: "%s | PadelFlow" },
  description: "The social platform for padel players.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://padelflow.com"),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}

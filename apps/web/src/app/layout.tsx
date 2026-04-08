import type { Metadata, Viewport } from "next";
import "../styles/globals.css";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ToastContainer } from "@/components/ui/toast";

export const metadata: Metadata = {
  title: {
    default: "DA Apparels — Luxury Nigerian Fashion",
    template: "%s | DA Apparels",
  },
  description:
    "Bespoke luxury fashion crafted in Nigeria. Discover curated collections, fabric customisation, and personal style consulting.",
  keywords: ["luxury fashion", "bespoke", "Nigerian fashion", "DA Apparels"],
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    siteName: "DA Apparels",
  },
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <QueryProvider>{children}</QueryProvider>
        <ToastContainer />
      </body>
    </html>
  );
}

import "./globals.css";

import type { Metadata, Viewport } from "next";

import { LoadingProvider } from "@/components/LoadingOverlay";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Family Meal Planner",
  description: "Private family meal planning MVP",
  applicationName: "Family Meal Planner",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#f8f3ee",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ThemeProvider>
          <LoadingProvider>
            {children}
            <Toaster richColors />
            <ServiceWorkerRegister />
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

import "./globals.css";

import type { Metadata } from "next";

import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Family Meal Planner",
  description: "Private family meal planning MVP",
  applicationName: "Family Meal Planner",
  themeColor: "#f8f3ee",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">
        <ThemeProvider>
          {children}
          <Toaster richColors />
          <ServiceWorkerRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}

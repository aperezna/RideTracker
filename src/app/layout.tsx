import type { Metadata } from "next";
import "./globals.css";

import { AppNavigation } from "@/components/layout/AppNavigation";

export const metadata: Metadata = {
  title: "RideTracker",
  description: "Personal theme park and ride tracker",
  applicationName: "RideTracker",
  appleWebApp: { capable: true, title: "RideTracker", statusBarStyle: "black-translucent" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AppNavigation />
        {children}
      </body>
    </html>
  );
}

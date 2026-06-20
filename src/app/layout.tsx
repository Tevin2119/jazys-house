import type { Metadata } from "next";
import { Marcellus, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";
import { AnalyticsProvider } from "@/components/analytics/analytics-provider";
import { Providers } from "./providers";
import { auth } from "@/auth";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const marcellus = Marcellus({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Jazy's House",
    template: "%s · Jazy's House",
  },
  description: "African handmade clothing, accessories, superfoods & catering.",
  applicationName: "Jazy's House",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/images/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/images/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/images/icon-192.png", sizes: "192x192" }],
  },
  appleWebApp: {
    capable: true,
    title: "Jazy's House",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  return (
    <html lang="en">
      <body className={`${marcellus.variable} ${hankenGrotesk.variable}`}>
        <Providers session={session}>
          {children}
          <PwaRegister />
          <AnalyticsProvider />
        </Providers>
      </body>
    </html>
  );
}

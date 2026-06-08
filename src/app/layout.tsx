import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import "./globals.css";
import { PwaRegister } from "@/components/pwa-register";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${playfair.variable} ${dmSans.variable}`}>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}

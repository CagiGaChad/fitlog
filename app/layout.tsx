import type { Metadata, Viewport } from "next";
import { Barlow_Condensed, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";
import { TabBar } from "@/components/TabBar";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

const barlow = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["600", "700"],
});
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "FitLog",
  description: "Registro personal de comidas, macros y entrenamientos",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "FitLog",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#151513",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${barlow.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <div id="app" className="max-w-[520px] mx-auto px-4 pt-5 pb-2">
          {children}
        </div>
        <TabBar />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

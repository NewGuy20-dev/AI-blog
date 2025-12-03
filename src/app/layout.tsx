import type { Metadata, Viewport } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: "AI News Blog",
  description: "Auto-generated AI news",
  manifest: "/manifest.json",
  applicationName: "AI News Blog",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "AI News",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${sourceSerif.variable} antialiased font-sans`}
      >
        <ServiceWorkerRegistration />
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}

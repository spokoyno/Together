import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { ThemeBootstrap } from "@/components/providers/theme-bootstrap";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PwaInstallBanner } from "@/components/pwa/pwa-install-banner";
import { PwaRegister } from "@/components/pwa/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Together — пространство для пары",
  description: "Pre-MVP приватного приложения для пар.",
  manifest: "/manifest.webmanifest",
  applicationName: "Together",
  appleWebApp: {
    capable: true,
    title: "Together",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/icon-144.png", sizes: "144x144", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffafc" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1115" },
  ],
};

const themeInitScript = `
(() => {
  try {
    const stored = localStorage.getItem("together-theme");
    const theme = stored === "dark" || stored === "light"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body>
        <ThemeProvider>
          <ThemeBootstrap />
          <PwaInstallBanner />
          {children}
          <PwaRegister />
        </ThemeProvider>
      </body>
    </html>
  );
}

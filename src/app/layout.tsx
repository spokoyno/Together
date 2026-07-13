import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { getThemePreference } from "@/lib/profile/theme";
import { isTheme, THEME_COOKIE_NAME } from "@/lib/theme/constants";
import type { ThemePreference } from "@/types/domain";
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
    { media: "(prefers-color-scheme: dark)", color: "#110c0f" },
  ],
};

const themeInitScript = `
(() => {
  try {
    const key = "together-theme";
    const cookieTheme = document.cookie.match(/(?:^|; )together-theme=(dark|light)(?:;|$)/)?.[1];
    const stored = localStorage.getItem(key);
    const domTheme = document.documentElement.dataset.theme;
    const theme =
      stored === "dark" || stored === "light" ? stored
      : domTheme === "dark" || domTheme === "light" ? domTheme
      : cookieTheme === "dark" || cookieTheme === "light" ? cookieTheme
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    localStorage.setItem(key, theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.cookie = "together-theme=" + theme + "; path=/; max-age=31536000; samesite=lax";
  } catch {}
})();
`;

async function resolveServerTheme(): Promise<ThemePreference | undefined> {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE_NAME)?.value;
  if (isTheme(cookieTheme)) {
    return cookieTheme;
  }

  const dbTheme = await getThemePreference();
  if (dbTheme) {
    return dbTheme;
  }

  return undefined;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const serverTheme = await resolveServerTheme();

  return (
    <html data-theme={serverTheme} lang="ru" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body>
        <ThemeProvider initialTheme={serverTheme ?? null}>
          {children}
          <PwaRegister />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}

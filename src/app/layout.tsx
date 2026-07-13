import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import { LanguageProvider } from "@/components/providers/language-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { DEFAULT_LOCALE, LOCALE_COOKIE_NAME, normalizeLocale } from "@/lib/i18n/constants";
import { getLocalePreference } from "@/lib/profile/locale";
import { getThemePreference } from "@/lib/profile/theme";
import {
  DEFAULT_COLOR_PALETTE,
  THEME_COOKIE_NAME,
  isColorPalette,
} from "@/lib/theme/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: "Together — space for two",
  description: "Private app for couples.",
  manifest: "/manifest.webmanifest",
  applicationName: "Together",
  appleWebApp: {
    capable: true,
    title: "Together",
    statusBarStyle: "black-translucent",
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
  themeColor: "#0f0b0d",
};

const themeInitScript = `
(() => {
  try {
    const palettes = ["pink","blue","purple","emerald","amber"];
    const key = "together-theme";
    const cookieTheme = document.cookie.match(/(?:^|; )together-theme=(pink|blue|purple|emerald|amber|dark|light)(?:;|$)/)?.[1];
    const stored = localStorage.getItem(key);
    const domTheme = document.documentElement.dataset.theme;
    let theme = "pink";
    if (palettes.includes(stored)) theme = stored;
    else if (palettes.includes(domTheme)) theme = domTheme;
    else if (cookieTheme === "dark" || cookieTheme === "light") theme = "pink";
    else if (palettes.includes(cookieTheme)) theme = cookieTheme;
    localStorage.setItem(key, theme);
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = "dark";
    document.cookie = "together-theme=" + theme + "; path=/; max-age=31536000; samesite=lax";
    const localeKey = "together-locale";
    const cookieLocale = document.cookie.match(/(?:^|; )together-locale=([a-z]{2})(?:;|$)/)?.[1];
    const storedLocale = localStorage.getItem(localeKey);
    const locale = storedLocale || cookieLocale || "en";
    localStorage.setItem(localeKey, locale);
    document.documentElement.lang = locale;
    document.cookie = "together-locale=" + locale + "; path=/; max-age=31536000; samesite=lax";
  } catch {}
})();
`;

async function resolveServerPalette() {
  const cookieStore = await cookies();
  const cookieTheme = cookieStore.get(THEME_COOKIE_NAME)?.value;
  if (isColorPalette(cookieTheme)) {
    return cookieTheme;
  }

  const dbTheme = await getThemePreference();
  if (dbTheme) {
    return dbTheme;
  }

  return DEFAULT_COLOR_PALETTE;
}

async function resolveServerLocale() {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale) {
    return normalizeLocale(cookieLocale);
  }

  const dbLocale = await getLocalePreference();
  if (dbLocale) {
    return dbLocale;
  }

  return DEFAULT_LOCALE;
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [serverPalette, serverLocale] = await Promise.all([
    resolveServerPalette(),
    resolveServerLocale(),
  ]);

  return (
    <html data-theme={serverPalette} lang={serverLocale} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body>
        <ThemeProvider initialPalette={serverPalette}>
          <LanguageProvider initialLocale={serverLocale}>
            {children}
            <PwaRegister />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

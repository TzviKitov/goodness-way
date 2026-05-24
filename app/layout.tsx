import type { Metadata } from "next";
import { defaultLocale, localeDirection } from "@/lib/i18n/config";
import { fontVariables } from "@/lib/fonts";
import { siteConfig } from "@/lib/utils/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: siteConfig.name, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.authorName }],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
  },
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const dir = localeDirection[defaultLocale];

  return (
    <html lang={defaultLocale} dir={dir} className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}

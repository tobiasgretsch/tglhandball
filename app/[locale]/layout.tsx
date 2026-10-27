import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Inter, Barlow_Condensed } from "next/font/google";
import ConsentBanner from "@/components/ui/ConsentBanner";
import ConsentGatedAnalytics from "@/components/ui/ConsentGatedAnalytics";
import "../globals.css";
import { client, urlFor } from "@/lib/sanity";
import { settingsQuery } from "@/lib/queries";
import type { Settings } from "@/types";
import JsonLd from "@/components/ui/JsonLd";
import { SITE_URL, organizationJsonLd } from "@/lib/seo";
import { OG_LOCALES, routing } from "@/i18n/routing";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
});

type LocaleParams = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LocaleParams): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale, namespace: "meta" });
  const settings = await client
    .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => null);

  const logoUrl = settings?.logo
    ? urlFor(settings.logo).width(512).height(512).format("png").url()
    : null;

  const faviconUrl = settings?.favicon
    ? urlFor(settings.favicon).width(32).height(32).format("png").url()
    : null;
  const appleTouchUrl = settings?.favicon
    ? urlFor(settings.favicon).width(180).height(180).format("png").url()
    : null;

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: t("siteTitle"),
      template: "%s | TG MIPA Landshut",
    },
    description: t("siteDescription"),
    openGraph: {
      type: "website",
      locale: OG_LOCALES[locale],
      siteName: "TG MIPA Landshut Handball",
      ...(logoUrl && { images: [{ url: logoUrl, width: 512, height: 512, alt: t("logoAlt") }] }),
    },
    twitter: {
      card: "summary_large_image",
      site: "@tgmipa",
    },
    ...(faviconUrl && {
      icons: {
        icon: faviconUrl,
        shortcut: faviconUrl,
        apple: appleTouchUrl ?? faviconUrl,
      },
    }),
  };
}

// Inline script — applies saved dark/light theme before React hydrates.
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t !== 'light') {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
} & LocaleParams>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const settings = await client
    .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => null);

  const logoUrl = settings?.logo
    ? urlFor(settings.logo).width(256).height(256).format("png").url()
    : null;

  const jsonLd = organizationJsonLd(settings, logoUrl, locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <noscript>
          {/* Scroll-reveal content starts hidden; without JS it must stay visible. */}
          <style>{"[style*='opacity:0'],[style*='opacity: 0']{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <JsonLd data={jsonLd} />
      </head>
      <body className={`${inter.variable} ${barlowCondensed.variable} ${inter.className}`}>
        <NextIntlClientProvider>
          {children}
          <ConsentBanner />
          <ConsentGatedAnalytics />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

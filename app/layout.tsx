import type { Metadata } from "next";
import { Inter, Barlow_Condensed } from "next/font/google";
import ConsentBanner from "@/components/ui/ConsentBanner";
import ConsentGatedAnalytics from "@/components/ui/ConsentGatedAnalytics";
import "./globals.css";
import { client, urlFor } from "@/lib/sanity";
import { settingsQuery } from "@/lib/queries";
import type { Settings } from "@/types";
import JsonLd from "@/components/ui/JsonLd";
import { SITE_URL, organizationJsonLd } from "@/lib/seo";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  style: ["normal", "italic"],
  variable: "--font-barlow-condensed",
});

export async function generateMetadata(): Promise<Metadata> {
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
      default: "TG MIPA Landshut Handball",
      template: "%s | TG MIPA Landshut",
    },
    description:
      "Offizielle Website des TG MIPA Landshut: Handball in Landshut mit Herren-, Damen- und Jugendmannschaften. Spielplan, Ergebnisse, News und Hallenadresse.",
    openGraph: {
      type: "website",
      locale: "de_DE",
      siteName: "TG MIPA Landshut Handball",
      ...(logoUrl && { images: [{ url: logoUrl, width: 512, height: 512, alt: "TG MIPA Landshut Logo" }] }),
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
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await client
    .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => null);

  const logoUrl = settings?.logo
    ? urlFor(settings.logo).width(256).height(256).format("png").url()
    : null;

  const jsonLd = organizationJsonLd(settings, logoUrl);

  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <noscript>
          {/* Scroll-reveal content starts hidden; without JS it must stay visible. */}
          <style>{"[style*='opacity:0'],[style*='opacity: 0']{opacity:1!important;transform:none!important}"}</style>
        </noscript>
        <JsonLd data={jsonLd} />
      </head>
      <body className={`${inter.variable} ${barlowCondensed.variable} ${inter.className}`}>
        {children}
        <ConsentBanner />
        <ConsentGatedAnalytics />
      </body>
    </html>
  );
}

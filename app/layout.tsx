import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { client, urlFor } from "@/lib/sanity";
import { settingsQuery } from "@/lib/queries";
import type { Settings } from "@/types";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tglhandball.de";

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
      "Offizieller Internetauftritt des TG MIPA Landshut – Handball mit Leidenschaft seit Jahrzehnten. Aktuelle News, Spielplan, Mannschaften und mehr.",
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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsOrganization",
    name: settings?.clubName ?? "TG MIPA Landshut",
    url: SITE_URL,
    sport: "Handball",
    ...(logoUrl && { logo: logoUrl }),
    sameAs: [
      settings?.instagramUrl,
      settings?.facebookUrl,
      settings?.youtubeUrl,
    ].filter(Boolean),
    ...(settings?.contactEmail && { email: settings.contactEmail }),
    ...(settings?.venueName && settings?.venueAddress && {
      location: {
        "@type": "Place",
        name: settings.venueName,
        address: settings.venueAddress,
      },
    }),
  };

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
    >
      <html lang="de" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: themeScript }} />
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        </head>
        <body className={inter.className}>
          {children}
          <SpeedInsights />
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}

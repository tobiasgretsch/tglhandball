import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { client, urlFor } from "@/lib/sanity";
import { settingsQuery } from "@/lib/queries";
import type { Settings } from "@/types";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const settings = await client
    .fetch<Settings>(settingsQuery, {}, { next: { revalidate: 3600 } })
    .catch(() => null);

  const icons: Metadata["icons"] = settings?.favicon
    ? {
        icon: urlFor(settings.favicon).width(32).height(32).format("png").url(),
        shortcut: urlFor(settings.favicon).width(32).height(32).format("png").url(),
        apple: urlFor(settings.favicon).width(180).height(180).format("png").url(),
      }
    : undefined;

  return {
    title: "TG MIPA Landshut",
    description: "Handball in Landshut – TG MIPA",
    ...(icons && { icons }),
  };
}

// Inline script runs before React hydrates to apply saved theme class,
// preventing a flash of the wrong theme on page load.
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}

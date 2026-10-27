import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { permanentRedirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

// Vereins-Informationen sind auf der Über-uns-Seite. Redirect für Abwärtskompatibilität.
export default async function VereinsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  permanentRedirect({ href: "/ueberuns", locale });
}

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import ErrorPanel from "@/components/ui/ErrorPanel";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("notFound");
  return {
    title: t("metaTitle"),
    robots: { index: false, follow: true },
  };
}

export default async function SiteNotFound() {
  const t = await getTranslations("notFound");
  return <ErrorPanel code="404" title={t("title")} message={t("message")} />;
}

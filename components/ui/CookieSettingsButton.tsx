"use client";

import { useTranslations } from "next-intl";
import { openConsentSettings } from "@/lib/consent";

export default function CookieSettingsButton({ className }: { className?: string }) {
  const t = useTranslations("cookieSettings");
  return (
    <button type="button" onClick={openConsentSettings} className={className}>
      {t("label")}
    </button>
  );
}

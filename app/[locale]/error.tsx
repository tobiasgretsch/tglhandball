"use client";

import { useTranslations } from "next-intl";
import ErrorPanel from "@/components/ui/ErrorPanel";

interface ErrorPageProps {
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  const t = useTranslations("error");
  return (
    <ErrorPanel
      code={t("code")}
      title={t("title")}
      message={t("message")}
      action={
        <button type="button" onClick={reset} className="btn border-2 border-accent text-accent dark:border-white/40 dark:text-gray-100">
          {t("retry")}
        </button>
      }
    />
  );
}

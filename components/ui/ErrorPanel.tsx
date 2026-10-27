import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ReactNode } from "react";

interface ErrorPanelProps {
  code: string;
  title: string;
  message: string;
  /** Extra action, e.g. a retry button. */
  action?: ReactNode;
}

const QUICK_LINKS = [
  { href: "/spielplan", labelKey: "schedule" },
  { href: "/teams", labelKey: "teams" },
  { href: "/news", labelKey: "news" },
] as const;

/** Shared body for 404 and runtime-error pages — keeps visitors inside the site. */
export default function ErrorPanel({ code, title, message, action }: ErrorPanelProps) {
  const t = useTranslations("errorPanel");
  return (
    <section className="min-h-[70dvh] flex items-center bg-background dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="font-display font-bold italic text-7xl text-brand-red">{code}</p>
        <h1 className="mt-4 font-display font-bold italic uppercase text-3xl md:text-4xl text-text dark:text-gray-100 text-balance">
          {title}
        </h1>
        <p className="mt-4 text-base text-muted dark:text-gray-300 leading-relaxed">{message}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            {t("home")}
          </Link>
          {action}
        </div>

        <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold">
          {QUICK_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-block py-2 text-accent dark:text-accent-sky hover:underline underline-offset-4"
              >
                {t(`links.${link.labelKey}`)}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

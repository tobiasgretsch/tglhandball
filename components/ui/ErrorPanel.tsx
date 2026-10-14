import Link from "next/link";
import type { ReactNode } from "react";

interface ErrorPanelProps {
  code: string;
  title: string;
  message: string;
  /** Extra action, e.g. a retry button. */
  action?: ReactNode;
}

const QUICK_LINKS = [
  { href: "/spielplan", label: "Spielplan & Ergebnisse" },
  { href: "/teams", label: "Unsere Teams" },
  { href: "/news", label: "Neuigkeiten" },
  { href: "/ueberuns#kontakt", label: "Kontakt" },
] as const;

/** Shared body for 404 and runtime-error pages — keeps visitors inside the site. */
export default function ErrorPanel({ code, title, message, action }: ErrorPanelProps) {
  return (
    <section className="min-h-[70dvh] flex items-center bg-background dark:bg-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-24 text-center">
        <p className="font-display font-bold italic text-7xl text-primary">{code}</p>
        <h1 className="mt-4 font-display font-bold italic uppercase text-3xl md:text-4xl text-text dark:text-gray-100 text-balance">
          {title}
        </h1>
        <p className="mt-4 text-base text-muted dark:text-gray-300 leading-relaxed">{message}</p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Zur Startseite
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
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

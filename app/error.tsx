"use client";

import ErrorPanel from "@/components/ui/ErrorPanel";

interface ErrorPageProps {
  reset: () => void;
}

export default function ErrorPage({ reset }: ErrorPageProps) {
  return (
    <ErrorPanel
      code="Oops"
      title="Da ist etwas schiefgelaufen"
      message="Die Seite konnte nicht geladen werden. Bitte versuche es noch einmal."
      action={
        <button type="button" onClick={reset} className="btn border-2 border-accent text-accent dark:border-white/40 dark:text-gray-100">
          Erneut versuchen
        </button>
      }
    />
  );
}

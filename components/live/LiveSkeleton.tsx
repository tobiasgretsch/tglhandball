import { useTranslations } from "next-intl";

const LIST_ROWS = 3;

/** Placeholder rows for the part of a live page that waits on nuLiga. */
export function LiveListSkeleton({ rows = LIST_ROWS }: { rows?: number }) {
  const t = useTranslations("liveSkeleton");
  return (
    <div role="status" aria-busy="true" aria-label={t("loading")} className="space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl bg-white motion-reduce:animate-none dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

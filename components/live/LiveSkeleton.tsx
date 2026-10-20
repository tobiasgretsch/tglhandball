const LIST_ROWS = 3;
const TICKER_ROWS = 2;

/** Placeholder rows for the part of a live page that waits on nuLiga. */
export function LiveListSkeleton({ rows = LIST_ROWS }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Live-Daten werden geladen" className="space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="h-24 animate-pulse rounded-2xl bg-white motion-reduce:animate-none dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

/**
 * Whole-page placeholder for `loading.tsx` of a route that cannot stream its hero yet; the hero keeps
 * its real height so nothing jumps when the data has arrived.
 */
export default function LiveSkeleton({ rows = TICKER_ROWS }: { rows?: number }) {
  return (
    <>
      <div className="min-h-[340px] bg-gradient-to-br from-accent via-accent to-accent-deep md:min-h-[400px] lg:min-h-[500px]" />
      <section className="bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-3xl px-4 pb-20 pt-6 sm:px-6">
          <LiveListSkeleton rows={rows} />
        </div>
      </section>
    </>
  );
}

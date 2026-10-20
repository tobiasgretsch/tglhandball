const SKELETON_ROWS = 3;

/**
 * Instant placeholder for the live pages (rendered by their `loading.tsx`): the hero keeps its real
 * height so nothing jumps when the nuLiga data has arrived.
 */
export default function LiveSkeleton({ rows = SKELETON_ROWS }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Live-Ticker wird geladen">
      <div className="min-h-[340px] bg-gradient-to-br from-accent via-accent to-accent-deep md:min-h-[400px] lg:min-h-[500px]" />
      <section className="bg-background dark:bg-gray-900">
        <div className="mx-auto max-w-3xl space-y-4 px-4 pb-20 pt-6 sm:px-6">
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-white motion-reduce:animate-none dark:bg-gray-800"
            />
          ))}
        </div>
      </section>
    </div>
  );
}

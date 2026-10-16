/**
 * Per-instance request coalescing. Concurrent callers share one in-flight
 * promise, and a fresh result is reused for `ttlMs`; failures are never cached.
 */
interface Entry {
  expires: number;
  promise: Promise<unknown>;
}

const MAX_ENTRIES = 200;
const entries = new Map<string, Entry>();

/** Drops expired entries, then the oldest ones, so the map cannot grow without bound. */
function prune(map: Map<string, unknown>, isExpired: (value: never) => boolean = () => false) {
  for (const [key, value] of map) if (isExpired(value as never)) map.delete(key);
  while (map.size > MAX_ENTRIES) map.delete(map.keys().next().value as string);
}

export function coalesce<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T> {
  const cached = entries.get(key);
  if (cached && cached.expires > Date.now()) return cached.promise as Promise<T>;

  const promise = load();
  entries.set(key, { expires: Date.now() + ttlMs, promise });
  prune(entries, (entry: Entry) => entry.expires <= Date.now());
  promise.catch(() => {
    if (entries.get(key)?.promise === promise) entries.delete(key);
  });
  return promise;
}

const lastGood = new Map<string, unknown>();

/** Runs `load`; if it fails, serves the last successful result (marked stale) when there is one. */
export async function withStaleFallback<T>(
  key: string,
  load: () => Promise<T>,
): Promise<{ value: T; stale: boolean }> {
  try {
    const value = await load();
    lastGood.set(key, value);
    prune(lastGood);
    return { value, stale: false };
  } catch (error) {
    if (!lastGood.has(key)) throw error;
    return { value: lastGood.get(key) as T, stale: true };
  }
}

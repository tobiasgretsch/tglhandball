/** Time limits for promises. The underlying work keeps running; callers just stop waiting for it. */

/** Rejects when `promise` takes longer than `ms`. */
export async function withDeadline<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Time budget of ${ms} ms exceeded`)), Math.max(ms, 0));
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** `null` when the promise fails or takes longer than `ms`. */
export function withinBudget<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return withDeadline(promise, ms).catch(() => null);
}

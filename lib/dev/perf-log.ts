/**
 * Dev-only loader timing (stdout). Grep server logs with `[perf]` or run benchmark script.
 * No-op in production builds.
 */

export async function perfSpan<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  if (process.env.NODE_ENV !== 'development') {
    return fn()
  }
  const t0 = performance.now()
  try {
    return await fn()
  } finally {
    const ms = Math.round(performance.now() - t0)
    console.log(`[perf] ${label}: ${ms}ms`)
  }
}

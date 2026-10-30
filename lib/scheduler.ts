/**
 * Helper untuk menjalankan tugas non-kritis saat browser sedang senggang (idle),
 * sehingga tidak memblokir render utama (FCP/LCP/TBT).
 */
export function runWhenIdle(callback: () => void, timeoutMs: number = 2000): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // Jika browser mendukung requestIdleCallback
  if ('requestIdleCallback' in window) {
    const handle = (window as unknown as {
      requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback: (id: number) => void;
    }).requestIdleCallback(callback, { timeout: timeoutMs });

    return () => {
      if ('cancelIdleCallback' in window) {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(handle);
      }
    };
  }

  // Fallback untuk browser lain (misal Safari lama)
  const timer = setTimeout(callback, Math.min(timeoutMs, 1000));
  return () => clearTimeout(timer);
}


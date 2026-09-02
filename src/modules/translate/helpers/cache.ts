import { createHash } from 'crypto';

type CacheEntry<T> = { value: T; expiresAt: number };

const TTL_MS = 12 * 60 * 60 * 1000;
const MAX_ENTRIES = 400;
const store = new Map<string, CacheEntry<unknown>>();

export function translateCacheKey(sourceLang: string, targetLang: string, text: string): string {
  const hash = createHash('sha256').update(text).digest('hex');
  return `translate:${sourceLang}:${targetLang}:${hash}`;
}

export function getTranslateCache<T>(key: string): T | null {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function setTranslateCache<T>(key: string, value: T): void {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest) store.delete(oldest);
  }
  store.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

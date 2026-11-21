type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

type CacheStore = Map<string, CacheEntry<unknown>>;
type InFlightStore = Map<string, Promise<unknown>>;

const MAX_ENTRIES = 500;

const globalCache = globalThis as typeof globalThis & {
  __kagenimeCache?: CacheStore;
  __kagenimeInFlight?: InFlightStore;
};

const store: CacheStore = globalCache.__kagenimeCache ?? new Map();
const inFlight: InFlightStore = globalCache.__kagenimeInFlight ?? new Map();

if (!globalCache.__kagenimeCache) globalCache.__kagenimeCache = store;
if (!globalCache.__kagenimeInFlight) globalCache.__kagenimeInFlight = inFlight;

function evictIfNeeded() {
  if (store.size <= MAX_ENTRIES) return;
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiresAt <= now) store.delete(key);
  }
  while (store.size > MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest === undefined) break;
    store.delete(oldest);
  }
}

export async function cached<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>
): Promise<T> {
  if (ttlSeconds <= 0) return loader();

  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiresAt > now) return hit.value as T;
  if (hit) store.delete(key);

  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = loader()
    .then((value) => {
      store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
      evictIfNeeded();
      return value;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  inFlight.set(key, promise);
  return promise;
}

export function clearCache(prefix?: string) {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

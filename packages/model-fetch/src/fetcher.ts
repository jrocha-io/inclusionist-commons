import { concatChunks } from './chunks.js';

/** Result of fetching one model/asset file. */
export interface FetchResult {
  readonly bytes: Uint8Array;
  /** Wall-clock ms this call took. */
  readonly ms: number;
  /** Timestamp (ms) of the FIRST time this URL was fetched, or null if unknown. */
  readonly cachedSince: number | null;
}

export interface FetchOptions {
  /** Bypass + refresh the cache. */
  readonly force?: boolean;
  /** Download progress, 0..1 (only when the server sends a content-length). */
  readonly onProgress?: (frac: number) => void;
}

/** The DAO: fetch model bytes (cached + timestamped); clear the cache. */
export interface ModelFetcher {
  fetch(url: string, opts?: FetchOptions): Promise<FetchResult>;
  clear(): Promise<void>;
}

/** Injectable dependencies — so the fetcher is unit-testable with fakes and portable across environments. */
export interface HttpModelFetcherDeps {
  readonly cacheName?: string;
  readonly fetch?: typeof fetch;
  readonly caches?: CacheStorage;
  readonly storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;
  readonly now?: () => number;
}

/**
 * Fetches model files, caching them via the Cache API (offline after the first fetch) and stamping the
 * first-download time in storage. Streams the body to report progress. All I/O deps are injected.
 */
export class HttpModelFetcher implements ModelFetcher {
  readonly #cacheName: string;
  readonly #fetch: typeof fetch;
  readonly #caches: CacheStorage | undefined;
  readonly #storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | undefined;
  readonly #now: () => number;

  constructor(deps: HttpModelFetcherDeps = {}) {
    this.#cacheName = deps.cacheName ?? 'model-cache-v1';
    this.#fetch = deps.fetch ?? globalThis.fetch.bind(globalThis);
    this.#caches = deps.caches ?? (typeof caches !== 'undefined' ? caches : undefined);
    this.#storage = deps.storage;
    this.#now = deps.now ?? Date.now;
  }

  async fetch(url: string, opts: FetchOptions = {}): Promise<FetchResult> {
    const tsKey = 'tts_ts_' + url;
    const t0 = this.#now();
    const cache = this.#caches ? await this.#caches.open(this.#cacheName) : null;

    if (opts.force) {
      if (cache) await cache.delete(url);
      this.#storage?.removeItem(tsKey);
    }

    let response = !opts.force && cache ? await cache.match(url) : undefined;
    if (!response) {
      const fresh = await this.#fetch(url);
      if (!fresh.ok) throw new Error('HTTP ' + fresh.status + ' ' + url);
      if (cache) await cache.put(url, fresh.clone());
      response = fresh;
    }

    const bytes = await readBytes(response, opts.onProgress);

    let ts = this.#storage?.getItem(tsKey) ?? null;
    if (!ts) {
      ts = String(this.#now());
      this.#storage?.setItem(tsKey, ts);
    }
    return { bytes, ms: Math.round(this.#now() - t0), cachedSince: ts ? Number(ts) : null };
  }

  async clear(): Promise<void> {
    if (this.#caches) await this.#caches.delete(this.#cacheName);
  }
}

/** Read a Response into bytes, reporting progress when the body streams + a content-length is known. */
async function readBytes(response: Response, onProgress?: (frac: number) => void): Promise<Uint8Array> {
  const total = Number(response.headers.get('content-length') ?? 0);
  const body = response.body;
  if (body && typeof body.getReader === 'function') {
    const reader = body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value);
        loaded += value.length;
        if (total && onProgress) onProgress(loaded / total);
      }
    }
    return concatChunks(chunks, loaded);
  }
  return new Uint8Array(await response.arrayBuffer());
}

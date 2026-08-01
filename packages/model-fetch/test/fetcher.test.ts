import { describe, it, expect } from 'vitest';
import { concatChunks } from '../src/chunks.js';
import { HttpModelFetcher } from '../src/fetcher.js';

describe('concatChunks', () => {
  it('flattens chunks into one buffer', () => {
    const out = concatChunks([new Uint8Array([1, 2]), new Uint8Array([3])], 3);
    expect([...out]).toEqual([1, 2, 3]);
  });
});

// ---- fakes (body=null → the arrayBuffer path; no stream mocking needed) ----
class FakeResponse {
  ok = true;
  status = 200;
  headers = { get: (_: string) => null };
  body = null;
  constructor(private readonly bytes: Uint8Array) {}
  clone(): FakeResponse {
    return new FakeResponse(this.bytes);
  }
  arrayBuffer(): Promise<ArrayBuffer> {
    return Promise.resolve(this.bytes.slice().buffer);
  }
}
class FakeCache {
  store = new Map<string, FakeResponse>();
  match(url: string): Promise<FakeResponse | undefined> {
    return Promise.resolve(this.store.get(url));
  }
  put(url: string, res: FakeResponse): Promise<void> {
    this.store.set(url, res);
    return Promise.resolve();
  }
  delete(url: string): Promise<boolean> {
    return Promise.resolve(this.store.delete(url));
  }
}
class FakeCacheStorage {
  cache = new FakeCache();
  open(): Promise<FakeCache> {
    return Promise.resolve(this.cache);
  }
  delete(): Promise<boolean> {
    this.cache = new FakeCache();
    return Promise.resolve(true);
  }
}
function fakeStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
}

const URL_A = 'https://huggingface.co/csukuangfj/vits-piper-pt_BR-faber-medium/resolve/main/tokens.txt';

function makeFetcher() {
  let calls = 0;
  let clock = 1000;
  const fetchFn = ((_url: string) => {
    calls++;
    return Promise.resolve(new FakeResponse(new Uint8Array([9, 8, 7])) as unknown as Response);
  }) as unknown as typeof fetch;
  const caches = new FakeCacheStorage() as unknown as CacheStorage;
  const storage = fakeStorage();
  const fetcher = new HttpModelFetcher({ fetch: fetchFn, caches, storage, now: () => clock++ });
  return { fetcher, calls: () => calls, storage };
}

describe('HttpModelFetcher', () => {
  it('fetches, returns the bytes, caches, and stamps a first-download time', async () => {
    const { fetcher, calls } = makeFetcher();
    const r = await fetcher.fetch(URL_A);
    expect([...r.bytes]).toEqual([9, 8, 7]);
    expect(r.cachedSince).not.toBeNull();
    expect(calls()).toBe(1);
  });

  it('serves the second call from cache (no second network fetch), stable cachedSince', async () => {
    const { fetcher, calls } = makeFetcher();
    const first = await fetcher.fetch(URL_A);
    const second = await fetcher.fetch(URL_A);
    expect(calls()).toBe(1); // still one network hit
    expect(second.cachedSince).toBe(first.cachedSince); // timestamp persisted
    expect([...second.bytes]).toEqual([9, 8, 7]);
  });

  it('force re-fetches from the network', async () => {
    const { fetcher, calls } = makeFetcher();
    await fetcher.fetch(URL_A);
    await fetcher.fetch(URL_A, { force: true });
    expect(calls()).toBe(2);
  });

  it('throws on a non-ok response', async () => {
    const bad = ((_: string) => {
      const res = new FakeResponse(new Uint8Array());
      res.ok = false;
      res.status = 404;
      return Promise.resolve(res as unknown as Response);
    }) as unknown as typeof fetch;
    const f = new HttpModelFetcher({ fetch: bad, storage: fakeStorage() });
    await expect(f.fetch(URL_A)).rejects.toThrow('HTTP 404');
  });
});

// The sherpa-onnx-wasm build is chosen at load time by URL params: the multi-thread build (pthread,
// numThreads>1, needs COOP/COEP) vs the single-thread build. This maps the UI toggle ↔ those params.

/** The pthread build (numThreads>1). */
export const ENGINE_MULTI = 'tts';
/** The single-thread build. */
export const ENGINE_SINGLE = 'tts-single-thread';

export interface EngineParams {
  readonly engine: string;
  readonly threads: number;
}

/** Params for the multi-thread toggle: on → pthread build + 4 threads; off → single-thread + 1. */
export function engineParamsFor(multiThread: boolean): EngineParams {
  return multiThread ? { engine: ENGINE_MULTI, threads: 4 } : { engine: ENGINE_SINGLE, threads: 1 };
}

/** Whether an engine id is the multi-thread build. */
export function isMultiThread(engine: string): boolean {
  return engine === ENGINE_MULTI;
}

/** Read engine/threads from a URL query string (defaults: single-thread, 1 thread). */
export function parseEngineParams(search: string): EngineParams & { readonly multiThread: boolean } {
  const p = new URLSearchParams(search);
  const engine = p.get('engine') ?? ENGINE_SINGLE;
  const threads = Math.max(1, Number(p.get('threads') ?? 1) || 1);
  return { engine, threads, multiThread: isMultiThread(engine) };
}

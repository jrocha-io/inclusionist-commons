import { describe, it, expect, vi } from 'vitest';
import { DomLogger, MultiLogger, mirrorConsole, type Logger } from '../src/index.js';

class CollectLogger implements Logger {
  lines: string[] = [];
  log(m: string): void {
    this.lines.push(m);
  }
}

describe('DomLogger', () => {
  it('appends "message\\n" and scrolls to the bottom', () => {
    const el = { textContent: '', scrollTop: 0, scrollHeight: 999 } as unknown as HTMLElement;
    const logger = new DomLogger(el);
    logger.log('first');
    logger.log('second');
    expect(el.textContent).toBe('first\nsecond\n');
    expect(el.scrollTop).toBe(999);
  });
});

describe('MultiLogger', () => {
  it('fans a message out to every sink', () => {
    const a = new CollectLogger();
    const b = new CollectLogger();
    new MultiLogger(a, b).log('hi');
    expect(a.lines).toEqual(['hi']);
    expect(b.lines).toEqual(['hi']);
  });
});

describe('mirrorConsole', () => {
  it('mirrors into the logger AND still calls the original, then restores', () => {
    const spy = vi.fn();
    const original = console.error;
    console.error = spy;

    const collector = new CollectLogger();
    const restore = mirrorConsole(collector, ['error']);

    console.error('boom', { message: 'detail' });
    expect(spy).toHaveBeenCalledWith('boom', { message: 'detail' });
    expect(collector.lines).toEqual(['[c.error] boom detail']);

    restore();
    expect(console.error).toBe(spy); // restored to what it was before mirroring
    console.error = original;
  });
});

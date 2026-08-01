import { describe, it, expect } from 'vitest';
import { parseDownloadedRepos } from '../src/cache.js';

const HF = 'https://huggingface.co/csukuangfj/';

describe('parseDownloadedRepos', () => {
  it('extracts unique csukuangfj repo names, sorted', () => {
    const urls = [
      `${HF}vits-piper-pt_BR-faber-medium/resolve/main/pt_BR-faber-medium.onnx`,
      `${HF}vits-piper-pt_BR-faber-medium/resolve/main/tokens.txt`, // same repo, second file
      `${HF}kokoro-multi-lang-v1_0/resolve/main/model.onnx`,
    ];
    expect(parseDownloadedRepos(urls)).toEqual([
      'kokoro-multi-lang-v1_0',
      'vits-piper-pt_BR-faber-medium',
    ]);
  });
  it('ignores URLs that are not csukuangfj resolve links', () => {
    const urls = [
      'https://esm.sh/kokoro-js@1.2.1',
      `${HF}vits-piper-es_ES-davefx-medium/resolve/main/tokens.txt`,
      'https://example.com/csukuangfj/not-a-resolve-url',
    ];
    expect(parseDownloadedRepos(urls)).toEqual(['vits-piper-es_ES-davefx-medium']);
  });
  it('returns an empty array for no matches', () => {
    expect(parseDownloadedRepos(['https://example.com/x'])).toEqual([]);
    expect(parseDownloadedRepos([])).toEqual([]);
  });
});

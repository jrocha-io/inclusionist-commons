// Parse which voices are already downloaded, from cached request URLs (Cache API keys). Pure: the caller
// gathers the URLs; this extracts the unique csukuangfj repo names, sorted, for the "downloaded" list.

const REPO_RE = /csukuangfj\/([^/]+)\/resolve/;

/** Extract the unique, sorted csukuangfj repo names referenced by the given cached URLs. */
export function parseDownloadedRepos(urls: Iterable<string>): string[] {
  const repos = new Set<string>();
  for (const url of urls) {
    const m = REPO_RE.exec(url);
    if (m && m[1]) repos.add(m[1]);
  }
  return [...repos].sort();
}

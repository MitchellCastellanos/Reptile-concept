const BLOB_HOST = /^https:\/\/[^/]+\.public\.blob\.vercel-storage\.com\//;

export function isBlobUrl(url: string | null | undefined): url is string {
  return Boolean(url && BLOB_HOST.test(url));
}

/**
 * Canonical form of a Blob URL for reference matching: ignores scheme,
 * host casing, query/hash (e.g. `?download=1`), percent-encoding and
 * surrounding whitespace, so a URL stored with a slightly different spelling
 * still counts as "in use" instead of being treated as an orphan.
 */
export function normalizeBlobUrl(url: string): string {
  let s = url.trim();
  try {
    s = decodeURIComponent(s);
  } catch {
    // malformed escape sequence: compare the raw string
  }
  s = s.replace(/^https?:\/\//i, "").replace(/[?#].*$/, "");
  const slash = s.indexOf("/");
  return slash < 0 ? s.toLowerCase() : s.slice(0, slash).toLowerCase() + s.slice(slash);
}

/**
 * True only when `url` is hosted on the same Blob store as `token`
 * (`vercel_blob_rw_<storeId>_<secret>` → `<storeid>.public.blob.vercel-storage.com`).
 * Fails closed: an unparseable token or URL means "not ours", so it is never deleted.
 */
export function isOwnStoreUrl(url: string, token: string): boolean {
  const storeId = token.split("_")[3]?.toLowerCase();
  if (!storeId || !isBlobUrl(url)) return false;
  try {
    return new URL(url).hostname.toLowerCase().split(".")[0] === storeId;
  } catch {
    return false;
  }
}

const AGENT = 'histoday/0.1 (https://github.com/nickwang94/histoday)';

const isBrowser = 'document' in globalThis;

export async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      // Browsers forbid overriding User-Agent; Wikimedia accepts Api-User-Agent instead.
      ...(isBrowser ? { 'Api-User-Agent': AGENT } : { 'User-Agent': AGENT }),
      ...headers,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return (await res.json()) as T;
}

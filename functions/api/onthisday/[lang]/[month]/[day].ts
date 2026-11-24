import { getOnThisDay } from '../../../../../src/shared/onthisday';
import { isLang, isValidMonthDay } from '../../../../../src/shared/types';

/** Bump when the response shape or normalization changes to invalidate edge-cached copies. */
const CACHE_VERSION = 'v1';
const EDGE_TTL = 60 * 60 * 6;
const BROWSER_TTL = 60 * 30;

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

export const onRequestGet: PagesFunction = async (context) => {
  const { lang, month, day } = context.params as Record<string, string>;
  const m = Number(month);
  const d = Number(day);
  if (!isLang(lang) || !isValidMonthDay(m, d)) {
    return json({ error: 'Expected /api/onthisday/{en|zh|ja}/{MM}/{DD}' }, 400);
  }

  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(
    new URL(`/api/onthisday/${lang}/${m}/${d}?cache=${CACHE_VERSION}`, context.request.url).toString(),
  );
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  try {
    const data = await getOnThisDay(lang, m, d);
    const res = json(data, 200, {
      'Cache-Control': `public, max-age=${BROWSER_TTL}, s-maxage=${EDGE_TTL}`,
    });
    context.waitUntil(cache.put(cacheKey, res.clone()));
    return res;
  } catch (err) {
    return json({ error: 'Upstream Wikipedia request failed', detail: String(err) }, 502);
  }
};

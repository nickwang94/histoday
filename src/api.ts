import { getOnThisDay } from './shared/onthisday';
import type { Lang, OnThisDay } from './shared/types';

const memo = new Map<string, Promise<OnThisDay>>();

async function viaFunction(lang: Lang, month: number, day: number): Promise<OnThisDay> {
  const res = await fetch(`/api/onthisday/${lang}/${month}/${day}`);
  const type = res.headers.get('Content-Type') ?? '';
  if (!res.ok || !type.includes('application/json')) throw new Error(`API unavailable (${res.status})`);
  return (await res.json()) as OnThisDay;
}

/** Dev-only `?fixture=comp`: the approved design comp's story, for visual comparison against it. */
function compFixture(lang: Lang, month: number, day: number): OnThisDay {
  const story = {
    kind: 'events' as const,
    local: false,
    image: { source: '/assets/plates/story-photo.png' },
    url: 'https://en.wikipedia.org/wiki/On_the_Origin_of_Species',
  };
  const events = Array.from({ length: 49 }, (_, i) => ({
    ...story,
    id: `fixture-${i}`,
    year: i === 2 ? 1859 : 1800 + i * 4,
    text: i === 2 ? 'Charles Darwin publishes On the Origin of Species' : `Fixture story ${i + 1}`,
    pages: [
      {
        title: 'On the Origin of Species',
        description: '1859 work of scientific literature',
        url: story.url,
      },
    ],
  }));
  return { lang, month, day, source: 'fixture', items: { events, births: [], deaths: [] } };
}

/**
 * Prefers the cached Pages Function; falls back to calling Wikipedia directly
 * from the browser (both APIs allow CORS), e.g. under `vite dev` or on a
 * static-only host.
 */
export function loadOnThisDay(lang: Lang, month: number, day: number): Promise<OnThisDay> {
  if (import.meta.env.DEV && new URLSearchParams(location.search).get('fixture') === 'comp') {
    return Promise.resolve(compFixture(lang, month, day));
  }
  const key = `${lang}/${month}/${day}`;
  let p = memo.get(key);
  if (!p) {
    p = viaFunction(lang, month, day).catch(() => getOnThisDay(lang, month, day));
    p.catch(() => memo.delete(key));
    memo.set(key, p);
  }
  return p;
}

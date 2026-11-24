import { getOnThisDay } from './shared/onthisday';
import type { Lang, OnThisDay } from './shared/types';

const memo = new Map<string, Promise<OnThisDay>>();

async function viaFunction(lang: Lang, month: number, day: number): Promise<OnThisDay> {
  const res = await fetch(`/api/onthisday/${lang}/${month}/${day}`);
  const type = res.headers.get('Content-Type') ?? '';
  if (!res.ok || !type.includes('application/json')) throw new Error(`API unavailable (${res.status})`);
  return (await res.json()) as OnThisDay;
}

/**
 * Prefers the cached Pages Function; falls back to calling Wikipedia directly
 * from the browser (both APIs allow CORS), e.g. under `vite dev` or on a
 * static-only host.
 */
export function loadOnThisDay(lang: Lang, month: number, day: number): Promise<OnThisDay> {
  const key = `${lang}/${month}/${day}`;
  let p = memo.get(key);
  if (!p) {
    p = viaFunction(lang, month, day).catch(() => getOnThisDay(lang, month, day));
    p.catch(() => memo.delete(key));
    memo.set(key, p);
  }
  return p;
}

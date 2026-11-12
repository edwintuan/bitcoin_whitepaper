import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { DEPTHS } from '@/content/types';
import type { Depth, L, Lang } from '@/content/types';
import { toHansDeep } from './hans';

const LANG_KEY = 'bwe.lang';
const DEPTH_KEY = 'bwe.depth';

/** What goes on <html lang>: Traditional as in Hong Kong, Simplified as on the mainland. */
export const HTML_LANG: Record<Lang, string> = { en: 'en', zh: 'zh-Hant-HK', cn: 'zh-Hans-CN' };

/** Whether the reader is reading Chinese, in either script. */
export const isChinese = (lang: Lang): boolean => lang !== 'en';

/** Regions whose readers write Simplified, as they appear in a language tag. */
const HANS_TAG = /^(cn|zh-(hans|cn|sg|my)(-|$))/;

function parseLang(value: string | null | undefined): Lang | null {
  if (!value) return null;
  const tag = value.toLowerCase();
  if (tag === 'en' || tag.startsWith('en-')) return 'en';
  if (HANS_TAG.test(tag)) return 'cn';
  // Plain `zh` stays Traditional: links shared before the Simplified edition existed say `?lang=zh`.
  if (tag.startsWith('zh')) return 'zh';
  return null;
}

function parseDepth(value: string | null | undefined): Depth | null {
  return DEPTHS.includes(value as Depth) ? (value as Depth) : null;
}

/**
 * URL `?lang=` wins, then the stored choice, then the browser's preference
 * list. What the address asks for holds for that visit and is not stored: a
 * link someone shared should not change what a reader chose for themselves.
 */
export function resolveInitialLang(input: {
  search: string;
  stored: string | null;
  languages: readonly string[];
}): Lang {
  const fromUrl = parseLang(new URLSearchParams(input.search).get('lang'));
  if (fromUrl) return fromUrl;
  const fromStore = parseLang(input.stored);
  if (fromStore) return fromStore;
  for (const tag of input.languages) {
    const lang = parseLang(tag);
    if (lang) return lang;
  }
  return 'en';
}

/** URL `?depth=` wins, then the stored choice; otherwise the middle depth. */
export function resolveInitialDepth(input: { search: string; stored: string | null }): Depth {
  return (
    parseDepth(new URLSearchParams(input.search).get('depth')) ?? parseDepth(input.stored) ?? 'curious'
  );
}

// Storage can be unavailable (private windows, blocked cookies). The choice
// then simply lives in memory for the visit.
function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Nothing to do: the in-memory state already holds the choice.
  }
}

/**
 * Takes a parameter out of the address. Once the reader has chosen for
 * themselves, a `?lang=` or `?depth=` they arrived with must not overrule
 * that choice on the next reload.
 */
function dropParam(name: string): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has(name)) return;
  url.searchParams.delete(name);
  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export interface Settings {
  lang: Lang;
  depth: Depth;
  setLang(lang: Lang): void;
  setDepth(depth: Depth): void;
  /**
   * Increases each time the reader picks a depth. Collapsible blocks reset to
   * that depth's defaults when it changes, discarding manual open/close.
   */
  depthEpoch: number;
}

const SettingsContext = createContext<Settings | null>(null);

export function SettingsProvider({
  children,
  initialLang,
  initialDepth,
}: {
  children: ReactNode;
  /** Overrides detection. Used by tests. */
  initialLang?: Lang;
  initialDepth?: Depth;
}) {
  const [lang, setLangState] = useState<Lang>(
    () =>
      initialLang ??
      resolveInitialLang({
        search: window.location.search,
        stored: readStored(LANG_KEY),
        languages: navigator.languages ?? [navigator.language],
      }),
  );
  const [depth, setDepthState] = useState<Depth>(
    () =>
      initialDepth ??
      resolveInitialDepth({ search: window.location.search, stored: readStored(DEPTH_KEY) }),
  );
  const [depthEpoch, setDepthEpoch] = useState(0);

  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    // Before the page is drawn again: English and Chinese are set in different
    // sizes by `:lang()`, and whoever measures the new layout needs them applied.
    document.documentElement.lang = HTML_LANG[next];
    setLangState(next);
    writeStored(LANG_KEY, next);
    dropParam('lang');
  }, []);

  const setDepth = useCallback((next: Depth) => {
    setDepthState(next);
    setDepthEpoch((epoch) => epoch + 1);
    writeStored(DEPTH_KEY, next);
    dropParam('depth');
  }, []);

  const value = useMemo<Settings>(
    () => ({ lang, depth, setLang, setDepth, depthEpoch }),
    [lang, depth, setLang, setDepth, depthEpoch],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Settings {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useSettings must be used inside <SettingsProvider>');
  return settings;
}

/** The reader's language out of an `L<T>`. Simplified is the Chinese entry, converted. */
export function pick<T>(value: L<T>, lang: Lang): T {
  return lang === 'cn' ? toHansDeep(value.zh) : value[lang];
}

/** Returns a function that picks the current language out of an `L<T>`. */
export function useT(): <T>(value: L<T>) => T {
  const { lang } = useSettings();
  return useCallback(<T,>(value: L<T>) => pick(value, lang), [lang]);
}

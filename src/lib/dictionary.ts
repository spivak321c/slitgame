// Lazy English-dictionary validation.
//
// Each word length lives in its own Vite async chunk (src/data/words/words-N.ts),
// so the main bundle stays small and a length is only downloaded the first time
// it's played. The built Set is cached for the rest of the session — subsequent
// ENTER presses are O(1) with zero network or parse cost.
//
// Solo and duel share this module so both modes accept exactly the same words.

type WordBankModule = { WORDS_4?: readonly string[]; WORDS_5?: readonly string[]; WORDS_6?: readonly string[] };

const loaders: Record<number, () => Promise<WordBankModule>> = {
  4: () => import('../data/words/words-4'),
  5: () => import('../data/words/words-5'),
  6: () => import('../data/words/words-6'),
};

const keyByLength: Record<number, 'WORDS_4' | 'WORDS_5' | 'WORDS_6'> = {
  4: 'WORDS_4',
  5: 'WORDS_5',
  6: 'WORDS_6',
};

const cache = new Map<number, Set<string>>();

/** Loads + caches the word bank for a length. Returns null for unsupported lengths. */
export async function loadWordBank(length: number): Promise<Set<string> | null> {
  if (cache.has(length)) return cache.get(length)!;
  const loader = loaders[length];
  if (!loader) return null;
  const mod = await loader();
  const words = mod[keyByLength[length]] ?? [];
  const set = new Set(words);
  cache.set(length, set);
  return set;
}

/** True when `word` is in the English dictionary for its length. Fetches the
 *  chunk on first call for that length, then answers from cache. */
export async function isEnglishWord(length: number, word: string): Promise<boolean> {
  const bank = await loadWordBank(length);
  return bank ? bank.has(word.toUpperCase()) : false;
}
export type Lang = 'es' | 'en'

const KEY = 'helios-locale'

type StorageLike = {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

function storage(): StorageLike | null {
  const box = globalThis as { localStorage?: StorageLike }
  return box.localStorage ?? null
}

export function readStored(): Lang {
  try {
    const stored = storage()?.getItem(KEY)
    if (stored === 'en' || stored === 'es') return stored
  } catch {
    /* sin almacenamiento */
  }
  return 'en'
}

export function writeStored(lang: Lang) {
  try {
    storage()?.setItem(KEY, lang)
  } catch {
    /* preferencia solo en esta visita */
  }
}

/** Spanish when there is no document, so unit tests keep the original strings. */
export function uiLang(): Lang {
  const root = (globalThis as { document?: { documentElement?: { lang?: string } } }).document
  if (!root) return 'es'
  return root.documentElement?.lang === 'en' ? 'en' : 'es'
}

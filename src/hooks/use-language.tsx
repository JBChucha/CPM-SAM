'use client';

import * as React from 'react';

export type Language = 'th' | 'en';

const STORAGE_KEY = 'sam_language';

export const LANGUAGE_LABELS: Record<Language, string> = {
  th: 'ไทย',
  en: 'English'
};

/**
 * Stores the user's preferred UI language and reflects it on `<html lang>`.
 *
 * NOTE: this only records the preference — the project has no i18n runtime
 * (no next-intl / react-i18next), so copy is not translated yet. Wiring a
 * translation library to this value is a separate piece of work.
 */
export function useLanguage() {
  const [language, setLanguageState] = React.useState<Language>('th');

  // Read the persisted choice after mount so SSR and the first client render match.
  React.useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'th' || stored === 'en') {
      setLanguageState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLanguage = React.useCallback((next: Language) => {
    setLanguageState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  return { language, setLanguage };
}

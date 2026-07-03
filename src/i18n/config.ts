// i18n configuration + routing helpers.
// English is the default locale and lives at the site root (no /en prefix).
// German, French and Italian live under /de, /fr and /it.

export const LOCALES = ['en', 'de', 'fr', 'it'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

// Locales that get their own translated marketing routes (used to build hreflang).
export const TRANSLATED_LOCALES: Locale[] = ['en', 'de', 'fr', 'it'];

export const SITE_URL = 'https://rentaboatzakynthos.com';

export const OG_LOCALE: Record<Locale, string> = {
  en: 'en_US',
  de: 'de_DE',
  fr: 'fr_FR',
  it: 'it_IT',
};

export const LOCALE_LABEL: Record<Locale, string> = {
  en: 'EN',
  de: 'DE',
  fr: 'FR',
  it: 'IT',
};

export const LOCALE_NAME: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
};

// Circular flag icon filename (in /public/flags) per locale.
export const LOCALE_FLAG: Record<Locale, string> = {
  en: 'gb',
  de: 'de',
  fr: 'fr',
  it: 'it',
};

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}

/**
 * Read the active locale from a URL pathname. `/de/contact` -> `de`, `/contact` -> `en`.
 */
export function getLocaleFromUrl(url: URL): Locale {
  const seg = url.pathname.split('/').filter(Boolean)[0];
  return isLocale(seg) ? seg : DEFAULT_LOCALE;
}

/**
 * Given a canonical English path (e.g. `/contact` or `/`), return the path for `locale`.
 * `localizePath('/contact', 'de')` -> `/de/contact`; `localizePath('/', 'de')` -> `/de/`.
 */
export function localizePath(basePath: string, locale: Locale): string {
  const clean = basePath.startsWith('/') ? basePath : `/${basePath}`;
  if (locale === DEFAULT_LOCALE) return clean;
  if (clean === '/') return `/${locale}/`;
  return `/${locale}${clean}`;
}

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

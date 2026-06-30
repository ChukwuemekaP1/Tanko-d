import { cookies } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'

export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]

/**
 * es-MX is the primary audience (fleet managers and drivers). English is the
 * secondary, fully-supported locale that the ES/EN toggle switches to.
 */
export const defaultLocale: Locale = 'es'

/** Cookie that stores the user-selected locale (set by the language toggle). */
export const LOCALE_COOKIE = 'NEXT_LOCALE'

function resolveLocale(value: string | undefined): Locale {
  return locales.includes(value as Locale) ? (value as Locale) : defaultLocale
}

// No i18n routing: the active locale is resolved from a cookie on the server.
export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE)?.value)

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})

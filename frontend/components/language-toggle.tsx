"use client"

import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { cn } from "@/lib/utils"

const LOCALES = [
  { code: "es", labelKey: "spanish" as const },
  { code: "en", labelKey: "english" as const },
]

/**
 * ES / EN language switcher. Persists the choice in the NEXT_LOCALE cookie
 * (read server-side by i18n/request.ts) and refreshes the route so server
 * components re-render with the new locale.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const t = useTranslations("languageToggle")
  const locale = useLocale()
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const setLocale = (code: string) => {
    if (code === locale) return
    document.cookie = `NEXT_LOCALE=${code}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={cn(
        "inline-flex items-center rounded-md border border-border bg-background p-0.5",
        className,
      )}
    >
      {LOCALES.map(({ code, labelKey }) => {
        const isActive = locale === code
        return (
          <button
            key={code}
            type="button"
            onClick={() => setLocale(code)}
            disabled={isPending}
            aria-pressed={isActive}
            className={cn(
              "rounded px-2 py-1 text-xs font-semibold transition-colors disabled:opacity-50",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(labelKey)}
          </button>
        )
      })}
    </div>
  )
}

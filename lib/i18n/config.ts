export const locales = ["he", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "he";

/** Locales that are fully translated and exposed publicly. */
export const enabledLocales: Locale[] = ["he"];

export const localeNames: Record<Locale, string> = {
  he: "עברית",
  en: "English",
};

export const localeDirection: Record<Locale, "rtl" | "ltr"> = {
  he: "rtl",
  en: "ltr",
};

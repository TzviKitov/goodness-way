import { getRequestConfig } from "next-intl/server";
import { defaultLocale, enabledLocales, type Locale } from "./config";

function isEnabledLocale(value: string | undefined): value is Locale {
  return !!value && (enabledLocales as readonly string[]).includes(value);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale: Locale = isEnabledLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

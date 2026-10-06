import { cookies } from "next/headers";
import { defaultLocale, dictionaries, isLocale, type Dictionary, type Locale } from "./dictionaries";

export const LOCALE_COOKIE = "lms_locale";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getDictionary(): Promise<{ locale: Locale; t: Dictionary }> {
  const locale = await getLocale();
  return { locale, t: dictionaries[locale] };
}

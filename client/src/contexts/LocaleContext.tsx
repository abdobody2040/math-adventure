import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { formatNumber, Locale, translate } from "@/lib/locales";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  direction: "ltr" | "rtl";
  t: (key: string, values?: Record<string, string | number>) => string;
  number: (value: number) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => (localStorage.getItem("math-adventure-locale") === "ar" ? "ar" : "en"));
  const direction: "ltr" | "rtl" = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    localStorage.setItem("math-adventure-locale", locale);
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
  }, [direction, locale]);

  const value = useMemo<LocaleContextValue>(() => ({
    locale,
    setLocale,
    direction,
    t: (key: string, values?: Record<string, string | number>) => translate(locale, key, values),
    number: (value: number) => formatNumber(locale, value),
  }), [direction, locale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("LocaleProvider is required");
  return context;
}

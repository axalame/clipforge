import { createI18n } from "vue-i18n";
import type { LocaleMessageValue } from "vue-i18n";

export interface LocaleEntry {
  code: string;
  flag: string;
  label: string;
  match: (candidate: string) => boolean;
  rtl?: boolean;
}

export const localeEntries: LocaleEntry[] = [
  {
    code: "en-US",
    flag: "🇺🇸",
    label: "English",
    match: (candidate: string) => candidate.toLowerCase().startsWith("en"),
  },
  {
    code: "ru-RU",
    flag: "🇷🇺",
    label: "Русский",
    match: (candidate: string) => candidate.toLowerCase().startsWith("ru"),
  },
];

const localeMap = new Map(localeEntries.map((entry) => [entry.code, entry]));

const localeModules = import.meta.glob<{ default: Record<string, LocaleMessageValue> }>(
  "./*/*.json",
  { eager: true }
);

const loadLocaleMessages = (): Record<string, Record<string, LocaleMessageValue>> => {
  const aggregated: Record<string, Record<string, LocaleMessageValue>> = {};

  for (const moduleFilePath in localeModules) {
    const matched = moduleFilePath.match(/\.\/([^/]+)\/([^/]+)\.json$/);
    if (!matched) continue;

    const [, localeCode, moduleName] = matched;
    if (!aggregated[localeCode]) {
      aggregated[localeCode] = {};
    }

    const content = localeModules[moduleFilePath].default;
    // Flatten keys directly so t('btn_trim_file') works
    Object.assign(aggregated[localeCode], content);
    // Also attach under namespace so t('trim.btn_trim_file') works
    aggregated[localeCode][moduleName] = content;
  }

  return aggregated;
};

const getSystemLocale = (): string => {
  const systemLang = (typeof navigator !== "undefined" && (navigator.language || (navigator as any).userLanguage)) || "";
  const matched = localeEntries.find((entry) => entry.match(systemLang));
  return matched ? matched.code : "ru-RU";
};

const getSavedLocale = (): string | null => {
  try {
    const saved = localStorage.getItem("setting");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.locale) return parsed.locale;
    }
    const legacy = localStorage.getItem("studio_lang");
    if (legacy === "en") return "en-US";
    if (legacy === "ru") return "ru-RU";
  } catch {
    // Ignore error
  }
  return null;
};

export const resolveLocale = (targetLocale: string): string => {
  if (!targetLocale || targetLocale === "auto") return getSystemLocale();
  if (targetLocale === "en") return "en-US";
  if (targetLocale === "ru") return "ru-RU";
  return localeMap.has(targetLocale) ? targetLocale : getSystemLocale();
};

const defaultLocale = resolveLocale(getSavedLocale() || "auto");

export const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: "en-US",
  messages: loadLocaleMessages(),
});

export const setI18nLocale = (nextLocale: string): void => {
  const resolved = resolveLocale(nextLocale);
  (i18n.global.locale as any).value = resolved;
  if (typeof document !== "undefined") {
    document.documentElement.lang = resolved;
    document.documentElement.dir = "ltr";
  }
  try {
    let settingObj: Record<string, any> = {};
    const existing = localStorage.getItem("setting");
    if (existing) settingObj = JSON.parse(existing) || {};
    settingObj.locale = resolved;
    localStorage.setItem("setting", JSON.stringify(settingObj));
    localStorage.setItem("studio_lang", resolved.startsWith("en") ? "en" : "ru");
  } catch {
    // Ignore error
  }
};

if (typeof document !== "undefined") {
  document.documentElement.lang = defaultLocale;
  document.documentElement.dir = "ltr";
}

export default i18n;

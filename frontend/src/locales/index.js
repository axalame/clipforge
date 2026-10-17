import { createI18n } from "vue-i18n";
export const localeEntries = [
    {
        code: "en-US",
        flag: "🇺🇸",
        label: "English",
        match: (candidate) => candidate.toLowerCase().startsWith("en"),
    },
    {
        code: "ru-RU",
        flag: "🇷🇺",
        label: "Русский",
        match: (candidate) => candidate.toLowerCase().startsWith("ru"),
    },
];
const localeMap = new Map(localeEntries.map((entry) => [entry.code, entry]));
const localeModules = import.meta.glob("./*/*.json", { eager: true });
const loadLocaleMessages = () => {
    const aggregated = {};
    for (const moduleFilePath in localeModules) {
        const matched = moduleFilePath.match(/\.\/([^/]+)\/([^/]+)\.json$/);
        if (!matched)
            continue;
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
const getSystemLocale = () => {
    const systemLang = (typeof navigator !== "undefined" && (navigator.language || navigator.userLanguage)) || "";
    const matched = localeEntries.find((entry) => entry.match(systemLang));
    return matched ? matched.code : "ru-RU";
};
const getSavedLocale = () => {
    try {
        const saved = localStorage.getItem("setting");
        if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && parsed.locale)
                return parsed.locale;
        }
        const legacy = localStorage.getItem("studio_lang");
        if (legacy === "en")
            return "en-US";
        if (legacy === "ru")
            return "ru-RU";
    }
    catch {
        // Ignore error
    }
    return null;
};
export const resolveLocale = (targetLocale) => {
    if (!targetLocale || targetLocale === "auto")
        return getSystemLocale();
    if (targetLocale === "en")
        return "en-US";
    if (targetLocale === "ru")
        return "ru-RU";
    return localeMap.has(targetLocale) ? targetLocale : getSystemLocale();
};
const defaultLocale = resolveLocale(getSavedLocale() || "auto");
export const i18n = createI18n({
    legacy: false,
    locale: defaultLocale,
    fallbackLocale: "en-US",
    messages: loadLocaleMessages(),
});
export const setI18nLocale = (nextLocale) => {
    const resolved = resolveLocale(nextLocale);
    i18n.global.locale.value = resolved;
    if (typeof document !== "undefined") {
        document.documentElement.lang = resolved;
        document.documentElement.dir = "ltr";
    }
    try {
        let settingObj = {};
        const existing = localStorage.getItem("setting");
        if (existing)
            settingObj = JSON.parse(existing) || {};
        settingObj.locale = resolved;
        localStorage.setItem("setting", JSON.stringify(settingObj));
        localStorage.setItem("studio_lang", resolved.startsWith("en") ? "en" : "ru");
    }
    catch {
        // Ignore error
    }
};
if (typeof document !== "undefined") {
    document.documentElement.lang = defaultLocale;
    document.documentElement.dir = "ltr";
}
export default i18n;
//# sourceMappingURL=index.js.map
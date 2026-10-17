import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { darkTheme } from "naive-ui";
import type { StudioNav, ThemeMode } from "@/types";
import { i18n, setI18nLocale } from "@/locales";

export const useAppStore = defineStore("app", () => {
  const activeNav = ref<StudioNav>("download");
  const themeMode = ref<ThemeMode>((localStorage.getItem("studio_theme_mode") as ThemeMode) || "system");

  const systemMedia = typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  const systemIsDark = ref(systemMedia ? systemMedia.matches : true);

  if (systemMedia && systemMedia.addEventListener) {
    systemMedia.addEventListener("change", (e) => {
      systemIsDark.value = e.matches;
      applyThemeClass();
    });
  }

  const isDark = computed(() => {
    if (themeMode.value === "system") return systemIsDark.value;
    return themeMode.value === "dark";
  });

  const naiveTheme = computed(() => {
    return isDark.value ? darkTheme : null;
  });

  const applyThemeClass = () => {
    if (typeof document !== "undefined") {
      if (isDark.value) {
        document.body.classList.remove("theme-light");
      } else {
        document.body.classList.add("theme-light");
      }
    }
  };

  const setTheme = (mode: ThemeMode) => {
    themeMode.value = mode;
    try {
      localStorage.setItem("studio_theme_mode", mode);
    } catch {}
    applyThemeClass();
  };

  const initTheme = () => {
    applyThemeClass();
  };

  const currentLocale = computed(() => {
    return (i18n.global.locale as any).value || "ru-RU";
  });

  const currentLang = computed(() => {
    return currentLocale.value.startsWith("en") ? "en" : "ru";
  });

  const setLanguage = (lang: string) => {
    setI18nLocale(lang);
  };

  return {
    activeNav,
    themeMode,
    isDark,
    naiveTheme,
    currentLang,
    currentLocale,
    setTheme,
    initTheme,
    setLanguage,
    applyThemeClass,
  };
});

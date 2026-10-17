<template>
  <header class="studio-topbar">
    <div class="topbar-section-title">
      <span v-if="appStore.activeNav === 'download'">{{ t('title_download') }}</span>
      <span v-else-if="appStore.activeNav === 'trim'">{{ t('title_trim') }}</span>
      <span v-else-if="appStore.activeNav === 'geometry'">{{ t('title_geometry') }}</span>
      <span v-else-if="appStore.activeNav === 'effects'">{{ t('title_effects') }}</span>
      <span v-else-if="appStore.activeNav === 'audio'">{{ t('title_audio') }}</span>
      <span v-else-if="appStore.activeNav === 'export'">{{ t('title_export') }}</span>
      <span v-else-if="appStore.activeNav === 'media'">{{ t('title_media') }}</span>
      <span v-else-if="appStore.activeNav === 'settings'">{{ t('title_settings') }}</span>
    </div>

    <!-- Topbar Right Controls (Theme, Language, Files) -->
    <div style="display:flex; align-items:center; gap:8px;">
      <!-- Theme Mode Selector Dropdown -->
      <n-dropdown trigger="click" :options="themeOptions" @select="handleThemeSelect">
        <n-button size="small" secondary :title="t('tooltip_theme')">
          <template #icon>
            <svg v-if="appStore.themeMode === 'system'" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            <svg v-else-if="!appStore.isDark" viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg v-else viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </template>
          <span>{{ themeLabel }}</span>
        </n-button>
      </n-dropdown>

      <!-- Language Selector Dropdown -->
      <n-dropdown trigger="click" :options="langOptions" @select="handleLangSelect">
        <n-button size="small" secondary :title="t('tooltip_lang')">
          <template #icon>
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          </template>
          <span>{{ (appStore.currentLang || 'ru').toUpperCase() }}</span>
        </n-button>
      </n-dropdown>

      <n-button size="small" secondary @click="handlePickFiles">
        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:4px;">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        {{ t('add_files') }}
      </n-button>
      <n-button v-if="taskStore.latestOutput" size="small" type="primary" secondary @click="handleOpenResult">
        {{ t('open_result') }}
      </n-button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { h, computed } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NDropdown } from "naive-ui";
import { useAppStore } from "@/stores/app";
import { useQueueStore } from "@/stores/queue";
import { useTaskStore } from "@/stores/task";
import { apiClient } from "@/api/client";
import type { ThemeMode } from "@/types";

const { t } = useI18n();
const appStore = useAppStore();
const queueStore = useQueueStore();
const taskStore = useTaskStore();

const themeLabel = computed(() => {
  if (appStore.themeMode === "system") return t("theme_system");
  return appStore.themeMode === "dark" ? t("theme_dark") : t("theme_light");
});

// Vector SVG Icons for Theme and Language (Unified stroke style matching Sidebar Navigation)
const svgMonitor = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
const svgMoon = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const svgSun = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const svgGlobe = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>';

const renderDropdownIcon = (svgString: string) => {
  return () => h("span", {
    style: { display: "inline-flex", alignItems: "center", justifyContent: "center" },
    innerHTML: svgString,
  });
};

const themeOptions = computed(() => [
  {
    label: t("theme_system") + (appStore.themeMode === "system" ? " ✓" : ""),
    key: "system",
    icon: renderDropdownIcon(svgMonitor),
  },
  {
    label: t("theme_dark") + (appStore.themeMode === "dark" ? " ✓" : ""),
    key: "dark",
    icon: renderDropdownIcon(svgMoon),
  },
  {
    label: t("theme_light") + (appStore.themeMode === "light" ? " ✓" : ""),
    key: "light",
    icon: renderDropdownIcon(svgSun),
  },
]);

const langOptions = computed(() => [
  {
    label: (t("lang_ru") || "Русский") + (appStore.currentLang === "ru" ? " ✓" : ""),
    key: "ru",
    icon: renderDropdownIcon(svgGlobe),
  },
  {
    label: (t("lang_en") || "English") + (appStore.currentLang === "en" ? " ✓" : ""),
    key: "en",
    icon: renderDropdownIcon(svgGlobe),
  },
]);

const handleThemeSelect = (key: string) => {
  appStore.setTheme(key as ThemeMode);
};

const handleLangSelect = (key: string) => {
  appStore.setLanguage(key);
};

const handlePickFiles = async () => {
  const files = await apiClient.pickFiles();
  if (files && files.length > 0) {
    await queueStore.addFiles(files);
  }
};

const handleOpenResult = () => {
  if (taskStore.latestOutput) {
    apiClient.openPath(taskStore.latestOutput);
  }
};
</script>

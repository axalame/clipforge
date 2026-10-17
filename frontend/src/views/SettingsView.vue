<template>
  <div class="settings-container">
    <div class="settings-section-header">
      <span class="settings-section-title">{{ t('settings_required') }}</span>
      <n-button size="small" secondary @click="loadConfig" :loading="isRefreshingConfig">
        <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        {{ t('refresh') }}
      </n-button>
    </div>

    <!-- 0. Interface & Localization -->
    <div class="tool-card">
      <div class="tool-card-top">
        <div class="tool-title-wrap">
          <span class="tool-name">{{ t('settings_ui_section') }}</span>
          <span class="status-pill pill-success">{{ t('status_active') }}</span>
        </div>
      </div>

      <div class="tool-desc">
        {{ t('settings_ui_desc') }}
      </div>

      <div class="tool-meta-grid">
        <div class="tool-meta-row">
          <span class="meta-label">{{ t('theme_title') }}</span>
          <div style="display:flex; gap:8px;">
            <n-button
              size="small"
              :type="appStore.themeMode === 'system' ? 'primary' : 'default'"
              :secondary="appStore.themeMode !== 'system'"
              @click="setAppTheme('system')"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                  <line x1="8" y1="21" x2="16" y2="21"/>
                  <line x1="12" y1="17" x2="12" y2="21"/>
                </svg>
              </template>
              {{ t('theme_system') }}
            </n-button>
            <n-button
              size="small"
              :type="appStore.themeMode === 'dark' ? 'primary' : 'default'"
              :secondary="appStore.themeMode !== 'dark'"
              @click="setAppTheme('dark')"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              </template>
              {{ t('theme_dark') }}
            </n-button>
            <n-button
              size="small"
              :type="appStore.themeMode === 'light' ? 'primary' : 'default'"
              :secondary="appStore.themeMode !== 'light'"
              @click="setAppTheme('light')"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="5"/>
                  <line x1="12" y1="1" x2="12" y2="3"/>
                  <line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              </template>
              {{ t('theme_light') }}
            </n-button>
          </div>
        </div>

        <div class="tool-meta-row">
          <span class="meta-label">{{ t('lang_title') }}</span>
          <div style="display:flex; gap:8px;">
            <n-button
              size="small"
              :type="appStore.currentLang === 'ru' ? 'primary' : 'default'"
              :secondary="appStore.currentLang !== 'ru'"
              @click="setAppLang('ru')"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </template>
              Русский
            </n-button>
            <n-button
              size="small"
              :type="appStore.currentLang === 'en' ? 'primary' : 'default'"
              :secondary="appStore.currentLang !== 'en'"
              @click="setAppLang('en')"
            >
              <template #icon>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
              </template>
              English
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 1. yt-dlp -->
    <div class="tool-card">
      <div class="tool-card-top">
        <div class="tool-title-wrap">
          <span class="tool-name">yt-dlp</span>
          <span class="status-pill" :class="config.tools?.ytdlp?.ok ? 'pill-success' : 'pill-danger'">
            {{ config.tools?.ytdlp?.ok ? t('installed') : t('not_found') }}
          </span>
        </div>
        <div class="tool-top-actions">
          <n-select v-model:value="ytdlpSource" :options="sourceOptions" size="small" style="width: 150px;" />
          <n-button size="small" secondary @click="checkYtdlpUpdate" :loading="isCheckingUpdate">
            {{ t('check_updates') }}
          </n-button>
          <n-button size="small" secondary @click="pickYtdlp">
            {{ t('browse') }}
          </n-button>
        </div>
      </div>

      <div class="tool-desc">
        {{ t('ytdlp_desc') }}
      </div>

      <div class="tool-meta-grid">
        <div class="tool-meta-row">
          <span class="meta-label">{{ t('update_channel') }}</span>
          <n-select v-model:value="config.ytdlp_channel" :options="ytdlpChannelOptions" size="small" style="width: 130px;" @update:value="saveConfig" />
        </div>

        <div class="tool-meta-row">
          <span class="meta-label">{{ t('version') }}</span>
          <span class="meta-value">{{ config.tools?.ytdlp?.version || t('not_detected') }}</span>
          <n-button text size="tiny" @click="copyToClipboard(config.tools?.ytdlp?.version)" class="copy-btn" :title="t('copy_version')">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </n-button>
        </div>

        <div class="tool-meta-row">
          <span class="meta-label">{{ t('path') }}</span>
          <span class="meta-value path-mono">{{ config.tools?.ytdlp?.path || config.ytdlp_path || 'yt-dlp' }}</span>
          <n-button text size="tiny" @click="copyToClipboard(config.tools?.ytdlp?.path || config.ytdlp_path)" class="copy-btn" :title="t('copy_path')">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </n-button>
        </div>
      </div>
    </div>

    <!-- 2. Deno JS Runtime -->
    <div class="tool-card">
      <div class="tool-card-top">
        <div class="tool-title-wrap">
          <span class="tool-name">{{ t('deno_title') }}</span>
          <span class="status-pill" :class="config.tools?.deno?.ok ? 'pill-success' : 'pill-danger'">
            {{ config.tools?.deno?.ok ? t('installed') : t('not_found') }}
          </span>
        </div>
        <div class="tool-top-actions">
          <n-select v-model:value="denoSource" :options="sourceOptions" size="small" style="width: 150px;" />
          <n-button size="small" secondary @click="checkDenoUpdate" :loading="isCheckingDenoUpdate">
            {{ t('check_updates') }}
          </n-button>
          <n-button size="small" secondary @click="pickDeno">
            {{ t('browse') }}
          </n-button>
        </div>
      </div>

      <div class="tool-desc">
        {{ t('deno_desc') }}
      </div>

      <div class="tool-meta-grid">
        <div class="tool-meta-row">
          <span class="meta-label">{{ t('version') }}</span>
          <span class="meta-value">{{ config.tools?.deno?.version || t('not_detected') }}</span>
          <n-button text size="tiny" @click="copyToClipboard(config.tools?.deno?.version)" class="copy-btn" :title="t('copy_version')">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </n-button>
        </div>

        <div class="tool-meta-row">
          <span class="meta-label">{{ t('path') }}</span>
          <span class="meta-value path-mono">{{ config.tools?.deno?.path || config.deno_path || 'deno' }}</span>
          <n-button text size="tiny" @click="copyToClipboard(config.tools?.deno?.path || config.deno_path)" class="copy-btn" :title="t('copy_path')">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </n-button>
        </div>
      </div>
    </div>

    <!-- 3. FFmpeg + FFprobe -->
    <div class="tool-card">
      <div class="tool-card-top">
        <div class="tool-title-wrap">
          <span class="tool-name">FFmpeg + FFprobe</span>
          <span class="status-pill" :class="config.tools?.ffmpeg?.ok ? 'pill-success' : 'pill-danger'">
            {{ config.tools?.ffmpeg?.ok ? t('installed') : t('not_found') }}
          </span>
        </div>
        <div class="tool-top-actions">
          <n-select v-model:value="ffmpegSource" :options="sourceOptions" size="small" style="width: 150px;" />
          <n-button size="small" secondary @click="checkFfmpegUpdate" :loading="isCheckingFfmpegUpdate">
            {{ t('check_updates') }}
          </n-button>
          <n-button size="small" secondary @click="pickFfmpegDir">
            {{ t('browse') }}
          </n-button>
        </div>
      </div>

      <div class="tool-desc">
        {{ t('ffmpeg_desc') }}
      </div>

      <div class="tool-meta-grid">
        <div class="tool-meta-row">
          <span class="meta-label">{{ t('version') }}</span>
          <span class="meta-value">{{ config.tools?.ffmpeg?.version || t('not_detected') }}</span>
          <n-button text size="tiny" @click="copyToClipboard(config.tools?.ffmpeg?.version)" class="copy-btn" :title="t('copy_version')">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </n-button>
        </div>

        <div class="tool-meta-row">
          <span class="meta-label">{{ t('path') }}</span>
          <span class="meta-value path-mono">{{ config.tools?.ffmpeg?.path || config.ffmpeg_dir || 'ffmpeg' }}</span>
          <n-button text size="tiny" @click="copyToClipboard(config.tools?.ffmpeg?.path || config.ffmpeg_dir)" class="copy-btn" :title="t('copy_path')">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </n-button>
        </div>
      </div>
    </div>

    <!-- 4. YouTube Cookies -->
    <div class="tool-card">
      <div class="tool-card-top">
        <div class="tool-title-wrap">
          <span class="tool-name">{{ t('cookies_title') }}</span>
          <span class="status-pill" :class="config.tools?.cookie?.ok ? 'pill-success' : 'pill-warning'">
            {{ config.tools?.cookie?.ok ? t('cookies_connected') : t('not_specified') }}
          </span>
        </div>
        <div class="tool-top-actions">
          <n-button size="small" secondary @click="pickCookie">
            {{ t('select_cookies') }}
          </n-button>
        </div>
      </div>

      <div class="tool-desc">
        {{ t('cookies_desc') }}
      </div>

      <div class="tool-meta-grid">
        <div class="tool-meta-row">
          <span class="meta-label">{{ t('path') }}</span>
          <span class="meta-value path-mono">{{ config.cookie_file || t('no_file_selected') }}</span>
          <n-button v-if="config.cookie_file" text size="tiny" @click="copyToClipboard(config.cookie_file)" class="copy-btn" :title="t('copy_path')">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </n-button>
        </div>
      </div>
    </div>

    <!-- 5. Output folder -->
    <div class="tool-card">
      <div class="tool-card-top">
        <div class="tool-title-wrap">
          <span class="tool-name">{{ t('output_folder_title') }}</span>
          <span class="status-pill pill-success">{{ t('status_active') }}</span>
        </div>
        <div class="tool-top-actions">
          <n-button size="small" secondary @click="pickOutputDir">
            {{ t('select_folder') }}
          </n-button>
          <n-button size="small" secondary @click="openOutputDir">
            {{ t('open_explorer') }}
          </n-button>
        </div>
      </div>

      <div class="tool-desc">
        {{ t('output_folder_desc') }}
      </div>

      <div class="tool-meta-grid">
        <div class="tool-meta-row">
          <span class="meta-label">{{ t('path') }}</span>
          <span class="meta-value path-mono">{{ config.output_dir || 'downloads' }}</span>
          <n-button text size="tiny" @click="copyToClipboard(config.output_dir)" class="copy-btn" :title="t('copy_path')">
            <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </n-button>
        </div>
      </div>
    </div>

    <!-- 6. App Updates (GitHub Releases) -->
    <div class="tool-card">
      <div class="tool-card-top">
        <div class="tool-title-wrap">
          <span class="tool-name">{{ t('app_update_title', 'Обновление приложения') }}</span>
          <span class="status-pill" :class="appUpdateInfo?.has_update ? 'pill-warning' : 'pill-success'">
            {{ appUpdateInfo?.has_update ? t('update_available', 'Доступно обновление') : t('up_to_date', 'Актуальная версия') }}
          </span>
        </div>
        <div class="tool-top-actions">
          <n-button size="small" secondary @click="() => checkAppUpdate(false)" :loading="isCheckingAppUpdate">
            {{ t('check_for_updates', 'Проверить обновления') }}
          </n-button>
          <n-button v-if="appUpdateInfo?.has_update" size="small" type="primary" @click="installAppUpdate" :loading="isInstallingAppUpdate">
            {{ t('download_and_install', 'Скачать и обновить') }}
          </n-button>
        </div>
      </div>

      <div class="tool-desc">
        {{ appUpdateInfo?.msg || t('app_update_desc', 'Автоматическая проверка и установка обновлений напрямую с официального репозитория GitHub.') }}
      </div>

      <div class="tool-meta-grid">
        <div class="tool-meta-row">
          <span class="meta-label">{{ t('current_version', 'Текущая версия') }}</span>
          <span class="meta-value">v{{ appUpdateInfo?.current_version || config.app_version || '0.3.1' }}</span>
        </div>
        <div v-if="appUpdateInfo?.latest_version" class="tool-meta-row">
          <span class="meta-label">{{ t('latest_version', 'Последняя версия') }}</span>
          <span class="meta-value">v{{ appUpdateInfo.latest_version }}</span>
        </div>
      </div>
    </div>

    <!-- Bottom action bar -->
    <div style="display:flex; gap:12px; margin-top:8px; padding-top:14px; border-top:1px solid rgba(255,255,255,0.06);">
      <n-button type="primary" size="medium" @click="saveConfig" style="font-weight:600;">
        {{ t('save_settings') }}
      </n-button>
      <n-button secondary size="medium" @click="loadConfig" :loading="isRefreshingConfig">
        {{ t('recheck_components') }}
      </n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NSelect, useMessage } from "naive-ui";
import { useAppStore } from "@/stores/app";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";

const { t } = useI18n();
const message = useMessage();
const appStore = useAppStore();
const configStore = useConfigStore();

const isRefreshingConfig = ref(false);
const isCheckingUpdate = ref(false);
const isCheckingDenoUpdate = ref(false);
const isCheckingFfmpegUpdate = ref(false);
const isCheckingAppUpdate = ref(false);
const isInstallingAppUpdate = ref(false);
const appUpdateInfo = ref<any>(null);

const ytdlpSource = ref("custom");
const denoSource = ref("builtin");
const ffmpegSource = ref("builtin");

const config = ref<any>({
  app_version: "0.3.1",
  ffmpeg_dir: "ffmpeg",
  ytdlp_path: "yt-dlp",
  deno_path: "deno",
  ytdlp_channel: "stable",
  output_dir: "downloads",
  cookie_source: "none",
  cookie_file: "",
  tools: {
    ytdlp: { ok: false, version: "", path: "" },
    deno: { ok: false, version: "", path: "" },
    ffmpeg: { ok: false, version: "", path: "" },
    cookie: { ok: false },
  },
});

const sourceOptions = computed(() => [
  { label: t("source_builtin"), value: "builtin" },
  { label: t("source_path"), value: "path" },
  { label: t("source_custom"), value: "custom" },
]);

const ytdlpChannelOptions = computed(() => [
  { label: "Stable", value: "stable" },
  { label: "Nightly", value: "nightly" },
  { label: "Master", value: "master" },
]);

const setAppTheme = (mode: "system" | "dark" | "light") => {
  appStore.setTheme(mode);
};

const setAppLang = (lang: string) => {
  appStore.setLanguage(lang);
};

const loadConfig = async () => {
  isRefreshingConfig.value = true;
  try {
    const data: any = await apiClient.getConfig();
    if (data) {
      config.value = { ...config.value, ...data };
    }
    await configStore.fetchConfig();
  } catch (e) {
    console.error(e);
  } finally {
    isRefreshingConfig.value = false;
  }
};

const saveConfig = async () => {
  try {
    const res = await apiClient.saveConfig({
      ffmpeg_dir: config.value.ffmpeg_dir,
      ytdlp_path: config.value.ytdlp_path,
      deno_path: config.value.deno_path,
      ytdlp_channel: config.value.ytdlp_channel || "stable",
      output_dir: config.value.output_dir,
      cookie_source: config.value.cookie_source,
      cookie_file: config.value.cookie_file,
    });
    if (res) {
      config.value = res;
    }
    await configStore.fetchConfig();
    message.success(t("msg_settings_saved"));
  } catch (e) {
    message.error(String(e));
  }
};

const checkYtdlpUpdate = async () => {
  isCheckingUpdate.value = true;
  try {
    const res = await apiClient.updateYtdlp();
    if (res.ok) {
      message.success(res.msg || t("msg_ytdlp_actual"));
    } else {
      message.info(res.msg || t("msg_check_finished"));
    }
    await loadConfig();
  } catch (e: any) {
    message.error(t("msg_update_error") + e);
  } finally {
    isCheckingUpdate.value = false;
  }
};

const checkDenoUpdate = async () => {
  isCheckingDenoUpdate.value = true;
  try {
    const res = await apiClient.checkDenoUpdate();
    if (res.ok) {
      message.success(res.msg || t("msg_deno_actual"));
    } else {
      message.info(res.msg || t("msg_deno_finished"));
    }
    await loadConfig();
  } catch (e: any) {
    message.error(t("msg_deno_error") + e);
  } finally {
    isCheckingDenoUpdate.value = false;
  }
};

const checkFfmpegUpdate = async () => {
  isCheckingFfmpegUpdate.value = true;
  try {
    const res = await apiClient.checkFfmpegUpdate();
    if (res.ok) {
      if (res.is_latest) {
        message.success(res.msg || t("msg_ffmpeg_actual"));
      } else {
        message.info(res.msg || t("msg_ffmpeg_update_avail"));
      }
    } else {
      message.warning(res.msg || t("msg_ffmpeg_finished"));
    }
    await loadConfig();
  } catch (e: any) {
    message.error(t("msg_ffmpeg_error") + e);
  } finally {
    isCheckingFfmpegUpdate.value = false;
  }
};

const checkAppUpdate = async (silentParam?: boolean | Event) => {
  const silent = typeof silentParam === "boolean" ? silentParam : false;
  isCheckingAppUpdate.value = true;
  try {
    const res = await apiClient.checkAppUpdate();
    if (res && res.ok) {
      appUpdateInfo.value = res;
      if (!silent) {
        if (res.has_update) {
          message.info(res.msg);
        } else {
          message.success(res.msg);
        }
      }
    } else if (!silent) {
      message.error(res?.msg || "Ошибка проверки обновлений");
    }
  } catch (e: any) {
    if (!silent) {
      message.error("Сбой сети: " + (e.message || e));
    }
  } finally {
    isCheckingAppUpdate.value = false;
  }
};

const installAppUpdate = async () => {
  if (!appUpdateInfo.value?.download_url) {
    message.warning("Ссылка на скачивание не найдена");
    return;
  }
  isInstallingAppUpdate.value = true;
  message.loading("Скачивание установщика... Пожалуйста, подождите.", { duration: 15000 });
  try {
    const res = await apiClient.installAppUpdate(appUpdateInfo.value.download_url);
    if (res && res.ok) {
      message.success(res.msg);
    } else {
      message.error(res?.msg || "Ошибка установки обновления");
      isInstallingAppUpdate.value = false;
    }
  } catch (e: any) {
    message.error("Ошибка при обновлении: " + (e.message || e));
    isInstallingAppUpdate.value = false;
  }
};

const copyToClipboard = async (text: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success(t("msg_copied"));
  } catch {
    message.info(t("msg_copied") + ": " + text);
  }
};

const pickYtdlp = async () => {
  const f = await apiClient.selectFiles();
  if (f && f.length > 0) {
    config.value.ytdlp_path = f[0];
    await saveConfig();
  }
};

const pickDeno = async () => {
  const f = await apiClient.selectFiles();
  if (f && f.length > 0) {
    config.value.deno_path = f[0];
    await saveConfig();
  }
};

const pickFfmpegDir = async () => {
  const d = await apiClient.selectFolder();
  if (d) {
    config.value.ffmpeg_dir = d;
    await saveConfig();
  }
};

const pickCookie = async () => {
  const f = await apiClient.selectCookiesFile();
  if (f) {
    config.value.cookie_file = f;
    config.value.cookie_source = "file";
    await saveConfig();
    message.success(t("msg_cookies_saved"));
  }
};

const pickOutputDir = async () => {
  const d = await apiClient.selectFolder();
  if (d) {
    config.value.output_dir = d;
    await saveConfig();
  }
};

const openOutputDir = () => {
  if (config.value.output_dir) {
    apiClient.openInExplorer(config.value.output_dir);
  }
};

onMounted(() => {
  loadConfig();
  checkAppUpdate(true);
});
</script>

<template>
  <n-config-provider
    :theme="appStore.isDark ? darkTheme : null"
    :theme-overrides="appStore.isDark ? studioThemeOverrides : studioThemeOverridesLight"
  >
    <n-global-style />
    <n-notification-provider placement="bottom-right">
      <n-message-provider placement="bottom-right">
        <AppNotifier>
          <div class="studio-shell">
            <!-- 1. LEFT STUDIO SIDEBAR -->
            <Sidebar />

            <!-- 2. MAIN WORKSPACE CANVAS -->
            <div class="studio-main">
              <!-- Top Header -->
              <Topbar />

              <!-- Scrollable Content Canvas -->
              <main class="studio-content-scroll">
                <div class="studio-container">
                  <keep-alive>
                    <component :is="activeViewComponent" />
                  </keep-alive>
                </div>
              </main>

              <!-- Bottom Studio Render Bar -->
              <footer class="studio-render-bar">
                <div class="render-meta">
                  <div class="render-title-row">
                    <span>{{ displayStatusText }}</span>
                    <span>{{ taskStore.metricsText }}</span>
                  </div>
                  <n-progress
                    type="line"
                    :percentage="taskStore.progressPercent"
                    :processing="taskStore.isRunning"
                    :status="taskStore.isRunning ? 'success' : 'default'"
                    :show-indicator="false"
                    style="height: 4px;"
                  />
                </div>

                <div class="render-actions">
                  <n-button size="small" secondary @click="showTerminal = !showTerminal">
                    <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:4px;">
                      <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                    </svg>
                    {{ t('console_logs') }}
                  </n-button>
                  <n-button v-if="taskStore.isRunning" size="small" type="error" @click="handleCancelTask">
                    {{ t('stop') }}
                  </n-button>
                </div>
              </footer>

              <!-- Collapsible Terminal Drawer -->
              <div v-show="showTerminal" class="terminal-drawer">
                <div class="terminal-head">
                  <span>{{ t('terminal_title') }}</span>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <n-button size="tiny" secondary @click="copyTerminalLogs">
                      <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:4px;">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      {{ t('terminal_copy') }}
                    </n-button>
                    <n-button size="tiny" secondary @click="taskStore.terminalLogs = ''">{{ t('terminal_clear') }}</n-button>
                    <n-button size="tiny" quaternary @click="showTerminal = false">{{ t('terminal_close') }}</n-button>
                  </div>
                </div>
                <div class="terminal-body" id="terminal-scroller">{{ taskStore.terminalLogs }}</div>
              </div>
            </div>
          </div>
        </AppNotifier>
      </n-message-provider>
    </n-notification-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  darkTheme,
  NConfigProvider,
  NGlobalStyle,
  NNotificationProvider,
  NMessageProvider,
  NButton,
  NProgress,
} from "naive-ui";
import { useAppStore } from "@/stores/app";
import { useConfigStore } from "@/stores/config";
import { useTaskStore } from "@/stores/task";
import { apiClient } from "@/api/client";
import { showAppNotification } from "@/utils/notification";

import Sidebar from "@/components/layout/Sidebar.vue";
import Topbar from "@/components/layout/Topbar.vue";
import AppNotifier from "@/components/layout/AppNotifier.vue";

import DownloaderView from "@/views/DownloaderView.vue";
import TrimView from "@/views/TrimView.vue";
import GeometryView from "@/views/GeometryView.vue";
import EffectsView from "@/views/EffectsView.vue";
import AudioView from "@/views/AudioView.vue";
import ExportView from "@/views/ExportView.vue";
import MediaView from "@/views/MediaView.vue";
import SettingsView from "@/views/SettingsView.vue";

const { t } = useI18n();
const appStore = useAppStore();
const configStore = useConfigStore();
const taskStore = useTaskStore();

const showTerminal = ref(false);

const displayStatusText = computed(() => {
  return taskStore.statusText || t("status_ready");
});

const handleCancelTask = async () => {
  await apiClient.cancel();
  taskStore.isRunning = false;
  taskStore.statusText = t("status_cancelled");
  showAppNotification(
    "warning",
    t("notify_cancelled") || "Операция отменена",
    t("notify_cancelled_desc") || "Процесс был остановлен"
  );
};

const copyTerminalLogs = async () => {
  try {
    await navigator.clipboard.writeText(taskStore.terminalLogs);
  } catch (e) {
    console.error(e);
  }
};

watch(
  () => taskStore.terminalLogs,
  () => {
    if (showTerminal.value) {
      nextTick(() => {
        const scroller = document.getElementById("terminal-scroller");
        if (scroller) {
          scroller.scrollTop = scroller.scrollHeight;
        }
      });
    }
  }
);

// High-end Studio Theme Overrides (matching tset exactly)
const studioThemeOverrides = {
  common: {
    borderRadius: "6px",
    primaryColor: "#10b981",
    primaryColorHover: "#34d399",
    primaryColorPressed: "#059669",
    primaryColorSuppl: "#10b981",
    bodyColor: "#0b0e14",
    cardColor: "#151b26",
    modalColor: "#151b26",
    borderColor: "rgba(255, 255, 255, 0.08)",
    textColorBase: "#f8fafc",
  },
  Button: {
    borderRadiusMedium: "9999px",
    borderRadiusSmall: "9999px",
    borderRadiusLarge: "9999px",
    borderRadiusTiny: "9999px",
    fontWeight: "500",
    fontWeightStrong: "600",
  },
  Input: {
    borderRadius: "6px",
    color: "#10141d",
    colorFocus: "#121722",
  },
  Select: {
    borderRadius: "6px",
  },
};

const studioThemeOverridesLight = {
  common: {
    borderRadius: "6px",
    primaryColor: "#10b981",
    primaryColorHover: "#059669",
    primaryColorPressed: "#047857",
    primaryColorSuppl: "#10b981",
    bodyColor: "#f8fafc",
    cardColor: "#ffffff",
    modalColor: "#ffffff",
    borderColor: "rgba(0, 0, 0, 0.12)",
    textColorBase: "#0f172a",
    textColor1: "#0f172a",
    textColor2: "#1e293b",
    textColor3: "#475569",
  },
  Button: {
    borderRadiusMedium: "9999px",
    borderRadiusSmall: "9999px",
    borderRadiusLarge: "9999px",
    borderRadiusTiny: "9999px",
    fontWeight: "500",
    fontWeightStrong: "600",
    textColor: "#0f172a",
    textColorDefault: "#0f172a",
    textColorSecondary: "#0f172a",
    colorSecondary: "#f1f5f9",
    colorSecondaryHover: "#e2e8f0",
    borderSecondary: "1px solid rgba(0, 0, 0, 0.08)",
  },
  Input: {
    borderRadius: "6px",
    color: "#ffffff",
    colorFocus: "#ffffff",
    textColor: "#0f172a",
  },
  Select: {
    borderRadius: "6px",
  },
  Dropdown: {
    borderRadius: "8px",
    color: "#ffffff",
    optionTextColor: "#0f172a",
    optionTextColorHover: "#059669",
    optionColorHover: "#f1f5f9",
  },
};

const activeViewComponent = computed(() => {
  switch (appStore.activeNav) {
    case "download":
      return DownloaderView;
    case "trim":
      return TrimView;
    case "geometry":
      return GeometryView;
    case "effects":
      return EffectsView;
    case "audio":
      return AudioView;
    case "export":
      return ExportView;
    case "media":
      return MediaView;
    case "settings":
      return SettingsView;
    default:
      return DownloaderView;
  }
});

onMounted(async () => {
  appStore.initTheme();
  taskStore.bindWindowCallbacks();
  await configStore.fetchConfig();
  configStore.checkAppUpdate();
});
</script>

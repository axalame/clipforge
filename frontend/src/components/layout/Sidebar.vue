<template>
  <aside class="studio-sidebar">
    <div class="sidebar-brand">
      <div class="brand-mark">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
      </div>
      <div>
        <div class="brand-title">ClipForge</div>
      </div>
    </div>

    <!-- Active File Quick Indicator -->
    <div class="sidebar-source-box">
      <div class="source-label">
        <span>{{ t('active_file') }}</span>
        <span v-if="queueStore.fileQueue.length > 0" style="color:var(--accent);">{{ queueStore.selectedIndex + 1 }}/{{ queueStore.fileQueue.length }}</span>
      </div>
      <div v-if="queueStore.activeFileName" class="source-file-badge" :title="queueStore.activeFilePath" style="gap:8px; display:flex; align-items:center;">
        <img v-if="queueStore.activeFrameSrc" :src="queueStore.activeFrameSrc" style="width:28px; height:20px; object-fit:cover; border-radius:3px; flex-shrink:0; background:#000;" />
        <svg v-else viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;">
          <rect x="2" y="2" width="20" height="20" rx="2" ry="2"/>
          <line x1="7" y1="2" x2="7" y2="22"/>
        </svg>
        <span style="overflow:hidden; text-overflow:ellipsis; flex:1; min-width:0;">{{ queueStore.activeFileName }}</span>
        <button
          class="badge-remove-btn"
          @click.stop="handleRemoveActiveFile"
          :title="t('remove_active_file') || 'Удалить активный файл'"
        >
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div v-else style="display:flex; justify-content:center;">
        <n-button size="tiny" secondary style="width:100%; font-size:11px;" @click="handlePickFiles">
          + {{ t('add_files') }}
        </n-button>
      </div>
    </div>

    <!-- Sidebar Studio Navigation -->
    <nav class="sidebar-nav">
      <div class="nav-item" :class="{ 'is-active': appStore.activeNav === 'download' }" @click="appStore.activeNav = 'download'">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        <span>{{ t('nav_download') }}</span>
      </div>

      <div class="nav-item" :class="{ 'is-active': appStore.activeNav === 'trim' }" @click="appStore.activeNav = 'trim'">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="6" cy="6" r="3"/>
          <circle cx="6" cy="18" r="3"/>
          <line x1="20" y1="4" x2="8.12" y2="15.88"/>
          <line x1="14.47" y1="14.48" x2="20" y2="20"/>
          <line x1="8.12" y1="8.12" x2="12" y2="12"/>
        </svg>
        <span>{{ t('nav_trim') }}</span>
      </div>

      <div class="nav-item" :class="{ 'is-active': appStore.activeNav === 'geometry' }" @click="appStore.activeNav = 'geometry'">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6.13 1L6 16a2 2 0 0 0 2 2h15"/>
          <path d="M1 6.13L16 6a2 2 0 0 1 2 2v15"/>
        </svg>
        <span>{{ t('nav_geometry') }}</span>
      </div>

      <div class="nav-item" :class="{ 'is-active': appStore.activeNav === 'effects' }" @click="appStore.activeNav = 'effects'">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="12 2 2 7 12 12 22 7 12 2"/>
          <polyline points="2 17 12 22 22 17"/>
          <polyline points="2 12 12 17 22 12"/>
        </svg>
        <span>{{ t('nav_effects') }}</span>
      </div>

      <div class="nav-item" :class="{ 'is-active': appStore.activeNav === 'audio' }" @click="appStore.activeNav = 'audio'">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/>
        </svg>
        <span>{{ t('nav_audio') }}</span>
      </div>

      <div class="nav-item" :class="{ 'is-active': appStore.activeNav === 'export' }" @click="appStore.activeNav = 'export'">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <line x1="4" y1="21" x2="4" y2="14"/>
          <line x1="4" y1="10" x2="4" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12" y2="3"/>
          <line x1="20" y1="21" x2="20" y2="16"/>
          <line x1="20" y1="12" x2="20" y2="3"/>
          <line x1="1" y1="14" x2="7" y2="14"/>
          <line x1="9" y1="8" x2="15" y2="8"/>
          <line x1="17" y1="16" x2="23" y2="16"/>
        </svg>
        <span>{{ t('nav_export') }}</span>
      </div>

      <div class="nav-item" :class="{ 'is-active': appStore.activeNav === 'media' }" @click="appStore.activeNav = 'media'">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/>
          <line x1="7" y1="2" x2="7" y2="22"/>
          <line x1="17" y1="2" x2="17" y2="22"/>
          <line x1="2" y1="12" x2="22" y2="12"/>
        </svg>
        <span>{{ t('nav_media') }}</span>
        <span v-if="queueStore.fileQueue.length > 0" style="margin-left:auto; font-size:11px; background:var(--bg-panel); padding:1px 6px; border-radius:10px;">{{ queueStore.fileQueue.length }}</span>
      </div>

      <div class="nav-item" :class="{ 'is-active': appStore.activeNav === 'settings' }" @click="appStore.activeNav = 'settings'">
        <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span>{{ t('nav_settings') }}</span>
      </div>
    </nav>

    <!-- Bottom Tool Status Health -->
    <div class="sidebar-footer">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span>FFmpeg:</span>
        <span style="display:flex; align-items:center; gap:5px;">
          <span class="tool-dot" :class="configStore.toolStatuses.ffmpeg.ok ? 'is-ok' : 'is-err'"></span>
          <span>{{ configStore.toolStatuses.ffmpeg.ok ? t('status_active') : t('status_error') }}</span>
        </span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span>yt-dlp:</span>
        <span style="display:flex; align-items:center; gap:5px;">
          <span class="tool-dot" :class="configStore.toolStatuses.ytdlp.ok ? 'is-ok' : 'is-err'"></span>
          <span>{{ configStore.toolStatuses.ytdlp.ok ? t('status_active') : t('status_error') }}</span>
        </span>
      </div>
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span>Deno JS:</span>
        <span style="display:flex; align-items:center; gap:5px;">
          <span class="tool-dot" :class="configStore.toolStatuses.deno.ok ? 'is-ok' : 'is-err'"></span>
          <span>{{ configStore.toolStatuses.deno.ok ? t('status_active') : t('status_error') }}</span>
        </span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { NButton } from "naive-ui";
import { useAppStore } from "@/stores/app";
import { useQueueStore } from "@/stores/queue";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";

const { t } = useI18n();
const appStore = useAppStore();
const queueStore = useQueueStore();
const configStore = useConfigStore();

const handlePickFiles = async () => {
  const files = await apiClient.pickFiles();
  if (files && files.length > 0) {
    await queueStore.addFiles(files);
  }
};

const handleRemoveActiveFile = () => {
  if (queueStore.activeFilePath) {
    queueStore.removeFile(queueStore.activeFilePath);
  } else if (queueStore.fileQueue.length > 0) {
    queueStore.removeFile(queueStore.fileQueue[0].path);
  }
};
</script>

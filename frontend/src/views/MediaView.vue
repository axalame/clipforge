<template>
  <div class="media-layout">
    <!-- Left: File Queue List -->
    <div class="media-queue-col">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-weight:600; font-size:13px;">{{ t('queue_files') }} ({{ queueStore.fileQueue.length }})</span>
        <n-button size="tiny" secondary @click="clearFiles">{{ t('clear_all') }}</n-button>
      </div>

      <div style="flex:1; overflow-y:auto; display:flex; flex-direction:column; gap:6px; max-height:calc(100vh - 220px);">
        <div
          v-for="(f, idx) in queueStore.fileQueue"
          :key="idx"
          class="queue-item-card"
          style="padding:8px 14px; border-radius:9999px; background:var(--bg-panel); border:1px solid var(--border-color); cursor:pointer; display:flex; justify-content:space-between; align-items:center; transition:all 0.15s ease;"
          :style="{
            borderColor: idx === queueStore.selectedIndex ? '#10b981' : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'),
            background: idx === queueStore.selectedIndex ? (isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)') : 'var(--bg-panel)'
          }"
          @click="selectFile(idx)"
        >
          <div style="overflow:hidden; padding-right:8px;">
            <div class="queue-item-title" style="font-size:12px; font-weight:600; color:var(--text-main); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              {{ f.path.split(/[\\/]/).pop() }}
            </div>
            <div style="font-size:10px; color:var(--text-sub); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              {{ f.path }}
            </div>
          </div>
          <n-button size="tiny" quaternary circle @click.stop="removeFile(idx)" :title="t('delete_from_queue')">
            ×
          </n-button>
        </div>

        <div v-if="queueStore.fileQueue.length === 0" style="padding:40px 20px; text-align:center; color:var(--text-sub); border:1px dashed var(--border-color); border-radius:8px; white-space:pre-line;">
          {{ t('queue_empty') }}
        </div>
      </div>
    </div>

    <!-- Right: Large Player & Media Info -->
    <div class="media-preview-col">
      <div class="native-video-wrapper" :class="{ 'has-video': queueStore.activeVideoSrc && !queueStore.hasVideoError }" style="position:relative;">
        <video
          v-show="queueStore.activeVideoSrc && !queueStore.hasVideoError"
          id="native-preview-video"
          :src="queueStore.activeVideoSrc"
          :poster="queueStore.activeFrameSrc"
          controls
          playsinline
          @error="onVideoError"
          style="width:100%; height:100%; object-fit:contain;"
        ></video>

        <div v-if="queueStore.activeFrameSrc && queueStore.hasVideoError" style="position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#000;">
          <img :src="queueStore.activeFrameSrc" style="width:100%; height:100%; object-fit:contain;" />
          <div style="position:absolute; bottom:12px; background:rgba(0,0,0,0.85); padding:8px 16px; border-radius:6px; display:flex; align-items:center; gap:12px; border:1px solid rgba(255,255,255,0.15);">
            <span style="font-size:12px; color:#cbd5e1;">{{ t('format_requires_player') }}</span>
            <n-button size="tiny" type="primary" secondary @click="openInWindowsPlayer">{{ t('open_in_windows_player') }}</n-button>
          </div>
        </div>

        <div v-if="!queueStore.activeVideoSrc" style="display:flex; flex-direction:column; align-items:center; gap:10px; color:var(--text-sub); font-size:13px; text-align:center; padding:20px;">
          <div style="width:44px; height:44px; border-radius:50%; background:var(--bg-panel); border:1px solid var(--border-color); display:flex; align-items:center; justify-content:center; box-shadow:0 2px 8px rgba(0,0,0,0.04);">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </div>
          <span>{{ t('select_video_left') }}</span>
        </div>
      </div>

      <div v-if="queueStore.selectedMediaInfo && queueStore.selectedMediaInfo.ok" class="studio-panel">
        <div class="panel-header">
          <span>{{ t('tech_specs') }}</span>
          <n-button size="tiny" secondary @click="openInWindowsPlayer">{{ t('in_windows_player') }}</n-button>
        </div>
        <n-table size="small" :bordered="false" :single-line="false" style="font-size:12px;">
          <tbody>
            <tr><td style="color:var(--text-muted); width:180px;">{{ t('duration') }}</td><td><b>{{ queueStore.selectedMediaInfo.duration_str }} ({{ queueStore.selectedMediaInfo.duration }} {{ t('sec_unit') }})</b></td></tr>
            <tr><td style="color:var(--text-muted);">{{ t('resolution') }}</td><td><b>{{ queueStore.selectedMediaInfo.video?.resolution }} ({{ queueStore.selectedMediaInfo.video?.aspect_ratio }})</b></td></tr>
            <tr><td style="color:var(--text-muted);">{{ t('video_codec') }}</td><td><b>{{ queueStore.selectedMediaInfo.video?.codec_long }}</b></td></tr>
            <tr><td style="color:var(--text-muted);">{{ t('framerate') }}</td><td><b>{{ queueStore.selectedMediaInfo.video?.fps }} fps</b></td></tr>
            <tr><td style="color:var(--text-muted);">{{ t('audio_codec') }}</td><td><b>{{ queueStore.selectedMediaInfo.audio?.codec_long }} ({{ queueStore.selectedMediaInfo.audio?.sample_rate }} Hz)</b></td></tr>
            <tr><td style="color:var(--text-muted);">{{ t('bitrate_size') }}</td><td><b>{{ queueStore.selectedMediaInfo.bitrate_kbps }} kbps / {{ queueStore.selectedMediaInfo.size_mb }} {{ t('mb_short') }}</b></td></tr>
          </tbody>
        </n-table>
      </div>
      <div v-else class="studio-panel" style="text-align:center; color:var(--text-sub); padding:30px;">
        {{ t('inspect_placeholder') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NTable } from "naive-ui";
import { useQueueStore } from "@/stores/queue";
import { useAppStore } from "@/stores/app";
import { apiClient } from "@/api/client";

const { t } = useI18n();
const queueStore = useQueueStore();
const appStore = useAppStore();

const isDark = computed(() => appStore.isDark);

const selectFile = (idx: number) => {
  queueStore.selectFile(queueStore.fileQueue[idx]);
};

const removeFile = (idx: number) => {
  const item = queueStore.fileQueue[idx];
  if (item) {
    queueStore.removeFile(item.path);
  }
};

const clearFiles = () => {
  queueStore.clearQueue();
};

const onVideoError = () => {
  queueStore.hasVideoError = true;
};

const openInWindowsPlayer = () => {
  if (queueStore.activeFilePath) {
    apiClient.previewFile(queueStore.activeFilePath);
  }
};
</script>

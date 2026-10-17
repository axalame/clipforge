<template>
  <div style="display:flex; flex-direction:column; gap:16px;">
    <!-- Subtabs Navigation -->
    <div class="studio-subtabs">
      <button class="subtab-btn" :class="{ 'is-active': subTrim === 'trim' }" @click="subTrim = 'trim'">{{ t('sub_trim_cut') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subTrim === 'split' }" @click="subTrim = 'split'">{{ t('sub_trim_split') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subTrim === 'speed' }" @click="subTrim = 'speed'">{{ t('sub_trim_speed') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subTrim === 'merge' }" @click="subTrim = 'merge'">{{ t('sub_trim_merge') }}</button>
    </div>

    <!-- 1. Trim Form with Live Video Player & Time Markers -->
    <div v-if="subTrim === 'trim'" style="display:flex; flex-direction:column; gap:16px;">
      <div class="interactive-stage-card" style="padding:14px;">
        <div class="stage-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="stage-title">{{ t('trim_preview_title') }}</span>
            <n-tag v-if="queueStore.activeVideoSrc" size="tiny" type="success" round>{{ t('player_ready') }}</n-tag>
            <n-tag v-else size="tiny" type="warning" round>{{ t('no_file_chosen') }}</n-tag>
          </div>
          <div style="font-size:11px; color:var(--text-sub);">
            {{ t('trim_hint') }}
          </div>
        </div>

        <div style="width:100%; aspect-ratio:16/9; max-height:360px; background:#000; border-radius:6px; overflow:hidden; position:relative; display:flex; align-items:center; justify-content:center; border:1px solid rgba(255,255,255,0.12);">
          <video
            v-show="queueStore.activeVideoSrc && !queueStore.hasVideoError"
            id="trim-preview-video"
            :src="queueStore.activeVideoSrc"
            :poster="queueStore.activeFrameSrc"
            controls
            playsinline
            style="width:100%; height:100%; object-fit:contain;"
            @timeupdate="onTrimVideoTimeUpdate"
            @error="onVideoError"
          ></video>

          <div v-if="queueStore.activeFrameSrc && queueStore.hasVideoError" style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; position:relative;">
            <img :src="queueStore.activeFrameSrc" style="width:100%; height:100%; object-fit:contain;" />
            <div style="position:absolute; bottom:12px; background:rgba(0,0,0,0.85); padding:6px 14px; border-radius:6px; display:flex; align-items:center; gap:10px; border:1px solid rgba(255,255,255,0.15);">
              <span style="font-size:11px; color:#cbd5e1;">{{ t('video_format_label') }}</span>
              <n-button size="tiny" type="primary" secondary @click="openInWindowsPlayer">{{ t('open_in_windows_player') }}</n-button>
            </div>
          </div>

          <div v-if="!queueStore.activeVideoSrc" class="stage-placeholder-grid">
            <div class="placeholder-hint">
              <span>{{ t('trim_choose_left') }}</span>
            </div>
          </div>
        </div>

        <!-- Marker Fast Actions Bar -->
        <div v-if="queueStore.activeVideoSrc" style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; background:var(--bg-sidebar); padding:8px 12px; border-radius:6px; border:1px solid var(--border-color);">
          <div style="font-size:12px; color:var(--text-muted); font-family:Consolas, monospace;">
            {{ t('current_frame') }} <b style="color:#34d399;">{{ currentTrimTimeFormatted }}</b>
          </div>
          <div style="display:flex; gap:10px;">
            <n-button size="tiny" secondary type="primary" @click="setTrimStartFromCurrent">
              {{ t('btn_set_start') }}
            </n-button>
            <n-button size="tiny" secondary type="info" @click="setTrimEndFromCurrent">
              {{ t('btn_set_end') }}
            </n-button>
          </div>
        </div>
      </div>

      <div class="studio-panel">
        <div class="panel-header">
          <span>{{ t('trim_params_title') }}</span>
          <n-tag size="small" type="success" round>
            {{ trimForm.start }} {{ t('sec_unit') }} — {{ trimForm.end }} {{ t('sec_unit') }} ({{ (trimEndTotal).toFixed(1) }} {{ t('sec_unit') }})
          </n-tag>
        </div>
        <div class="form-grid-2" style="margin-bottom:16px;">
          <div class="form-field">
            <label class="field-label">{{ t('time_start_label') }} {{ trimForm.start }} {{ t('sec_unit') }}</label>
            <div style="display:flex; gap:10px; align-items:center;">
              <n-slider v-model:value="trimForm.start" :min="0" :max="Math.max(30, queueStore.selectedMediaInfo?.duration || 120)" :step="0.1" style="flex:1;" />
              <n-input-number v-model:value="trimForm.start" :min="0" :step="0.1" style="width:90px;" />
            </div>
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('time_end_label') }} {{ trimForm.end }} {{ t('sec_unit') }}</label>
            <div style="display:flex; gap:10px; align-items:center;">
              <n-slider v-model:value="trimForm.end" :min="0" :max="Math.max(30, queueStore.selectedMediaInfo?.duration || 120)" :step="0.1" style="flex:1;" />
              <n-input-number v-model:value="trimForm.end" :min="0" :step="0.1" style="width:90px;" />
            </div>
          </div>
        </div>
        <n-flex :size="10">
          <n-button type="primary" @click="runOp('trim')">{{ t('btn_trim_file') }}</n-button>
          <n-button secondary @click="runBatch('trim')">{{ t('btn_trim_queue') }}</n-button>
        </n-flex>
      </div>
    </div>

    <!-- 2. Split Form -->
    <div v-if="subTrim === 'split'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('split_title') }}</span>
      </div>
      <div class="form-field" style="max-width:480px; margin-bottom:16px;">
        <label class="field-label">{{ t('split_duration_label') }} {{ splitForm.chunk_duration }} {{ t('sec_unit') }}</label>
        <div style="display:flex; gap:10px; align-items:center;">
          <n-slider v-model:value="splitForm.chunk_duration" :min="5" :max="300" :step="5" style="flex:1;" />
          <n-input-number v-model:value="splitForm.chunk_duration" :min="1" :max="3600" style="width:100px;" />
        </div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <n-button size="tiny" secondary @click="splitForm.chunk_duration = 15">{{ t('split_15s') }}</n-button>
          <n-button size="tiny" secondary @click="splitForm.chunk_duration = 30">{{ t('split_30s') }}</n-button>
          <n-button size="tiny" secondary @click="splitForm.chunk_duration = 60">{{ t('split_60s') }}</n-button>
          <n-button size="tiny" secondary @click="splitForm.chunk_duration = 180">{{ t('split_3m') }}</n-button>
        </div>
      </div>
      <n-button type="primary" @click="runOp('split')">{{ t('btn_split_file') }}</n-button>
    </div>

    <!-- 3. Speed Form -->
    <div v-if="subTrim === 'speed'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('speed_title') }}</span>
        <n-tag size="small" type="success" round>{{ t('speed_video_tag') }} {{ speedForm.speed }}x</n-tag>
      </div>

      <div style="display:flex; flex-direction:column; gap:16px; margin-bottom:18px;">
        <!-- Video Speed -->
        <div class="form-field">
          <label class="field-label">{{ t('speed_video_label') }}</label>
          <div style="display:flex; gap:12px; align-items:center;">
            <n-slider v-model:value="speedForm.speed" :min="0.25" :max="8" :step="0.25" style="flex:1;" />
            <n-input-number v-model:value="speedForm.speed" :min="0.25" :max="10" :step="0.25" style="width:110px;" />
          </div>
          <div style="display:flex; gap:6px; margin-top:8px;">
            <n-button size="tiny" secondary @click="speedForm.speed = 0.5">0.5x</n-button>
            <n-button size="tiny" secondary @click="speedForm.speed = 0.75">0.75x</n-button>
            <n-button size="tiny" secondary @click="speedForm.speed = 1.25">1.25x</n-button>
            <n-button size="tiny" secondary @click="speedForm.speed = 1.5">1.5x</n-button>
            <n-button size="tiny" secondary @click="speedForm.speed = 2.0">2.0x</n-button>
            <n-button size="tiny" secondary @click="speedForm.speed = 4.0">4.0x</n-button>
          </div>
        </div>

        <!-- Audio Handling Mode (Separate Audio Speed) -->
        <div class="form-field">
          <label class="field-label">{{ t('audio_mode_label') }}</label>
          <n-radio-group v-model:value="speedForm.audio_mode" name="audio-mode-group">
            <n-space vertical>
              <n-radio value="sync">
                <b>{{ t('audio_mode_sync') }}</b>
                <span style="font-size:11px; color:var(--text-sub); display:block;">{{ t('audio_mode_sync_desc') }}</span>
              </n-radio>
              <n-radio value="keep_original">
                <b style="color:#34d399;">{{ t('audio_mode_original') }}</b>
                <span style="font-size:11px; color:var(--text-sub); display:block;">{{ t('audio_mode_original_desc') }}</span>
              </n-radio>
              <n-radio value="custom">
                <b>{{ t('audio_mode_custom') }}</b>
                <span style="font-size:11px; color:var(--text-sub); display:block;">{{ t('audio_mode_custom_desc') }}</span>
              </n-radio>
              <n-radio value="mute">
                <b>{{ t('audio_mode_mute') }}</b>
                <span style="font-size:11px; color:var(--text-sub); display:block;">{{ t('audio_mode_mute_desc') }}</span>
              </n-radio>
            </n-space>
          </n-radio-group>
        </div>

        <!-- Custom Audio Speed Slider -->
        <div v-if="speedForm.audio_mode === 'custom'" class="form-field" style="background:var(--bg-panel-subtle); padding:12px; border-radius:6px; border:1px solid var(--border-color);">
          <label class="field-label">{{ t('audio_speed_label') }}</label>
          <div style="display:flex; gap:12px; align-items:center;">
            <n-slider v-model:value="speedForm.audio_speed" :min="0.25" :max="8" :step="0.25" style="flex:1;" />
            <n-input-number v-model:value="speedForm.audio_speed" :min="0.25" :max="10" :step="0.25" style="width:110px;" />
          </div>
        </div>

        <!-- Keep Pitch Option -->
        <div v-if="speedForm.audio_mode !== 'mute'" class="form-field" style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-sidebar); padding:10px 14px; border-radius:6px; border:1px solid var(--border-color);">
          <div>
            <div style="font-size:13px; font-weight:500;">{{ t('pitch_preserve_title') }}</div>
            <div style="font-size:11px; color:var(--text-sub);">{{ t('pitch_preserve_desc') }}</div>
          </div>
          <n-switch v-model:value="speedForm.keep_pitch" />
        </div>
      </div>

      <n-flex :size="10">
        <n-button type="primary" @click="runOp('change_speed')">{{ t('btn_speed_file') }}</n-button>
        <n-button secondary @click="runBatch('change_speed')">{{ t('btn_speed_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- 4. Merge Form -->
    <div v-if="subTrim === 'merge'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('merge_title') }}</span>
      </div>
      <div style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
        {{ t('merge_desc') }}
        {{ t('queue_contains') }} <b style="color:var(--accent);">{{ queueStore.fileQueue.length }}</b> {{ t('files_count_unit') }}
      </div>
      <n-button type="primary" @click="runMerge">{{ t('btn_merge_queue') }}</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  NButton,
  NSlider,
  NInputNumber,
  NTag,
  NFlex,
  NRadioGroup,
  NRadio,
  NSpace,
  NSwitch,
  useMessage,
} from "naive-ui";
import { useQueueStore } from "@/stores/queue";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";

const { t } = useI18n();
const message = useMessage();
const queueStore = useQueueStore();
const configStore = useConfigStore();

const subTrim = ref<"trim" | "split" | "speed" | "merge">("trim");
const currentTrimTime = ref(0);

const trimForm = ref({ start: 0, end: 60 });
const splitForm = ref({ chunk_duration: 30 });
const speedForm = ref({
  speed: 1.0,
  audio_mode: "sync",
  audio_speed: 1.0,
  keep_pitch: true,
});

const trimEndTotal = computed(() => {
  return Math.max(0, trimForm.value.end - trimForm.value.start);
});

const formatSec = (s: number) => {
  if (isNaN(s) || s < 0) return "00:00.0";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${ms}`;
};

const currentTrimTimeFormatted = computed(() => formatSec(currentTrimTime.value));

const onTrimVideoTimeUpdate = (e: any) => {
  currentTrimTime.value = e.target.currentTime;
};

const setTrimStartFromCurrent = () => {
  trimForm.value.start = Math.round(currentTrimTime.value * 10) / 10;
};

const setTrimEndFromCurrent = () => {
  trimForm.value.end = Math.round(currentTrimTime.value * 10) / 10;
};

const onVideoError = () => {
  queueStore.hasVideoError = true;
};

const openInWindowsPlayer = () => {
  if (queueStore.activeFilePath) {
    apiClient.openInPlayer(queueStore.activeFilePath);
  }
};

const runOp = async (op: string) => {
  if (!queueStore.activeFilePath) {
    message.warning(t("msg_select_first"));
    return;
  }
  const params: any = {};
  if (configStore.config.output_dir) params.output_dir = configStore.config.output_dir;

  if (op === "trim") {
    params.start = trimForm.value.start;
    params.end = trimForm.value.end;
  } else if (op === "split") {
    params.chunk_duration = splitForm.value.chunk_duration;
  } else if (op === "change_speed") {
    params.speed = speedForm.value.speed;
    params.audio_mode = speedForm.value.audio_mode;
    params.audio_speed = speedForm.value.audio_speed;
    params.keep_pitch = speedForm.value.keep_pitch;
  }

  await apiClient.startOperation(op, queueStore.activeFilePath, params);
};

const runBatch = async (op: string) => {
  if (queueStore.fileQueue.length === 0) {
    message.warning(t("msg_queue_empty_batch"));
    return;
  }
  const params: any = {};
  if (configStore.config.output_dir) params.output_dir = configStore.config.output_dir;

  if (op === "trim") {
    params.start = trimForm.value.start;
    params.end = trimForm.value.end;
  } else if (op === "split") {
    params.chunk_duration = splitForm.value.chunk_duration;
  } else if (op === "change_speed") {
    params.speed = speedForm.value.speed;
    params.audio_mode = speedForm.value.audio_mode;
    params.audio_speed = speedForm.value.audio_speed;
    params.keep_pitch = speedForm.value.keep_pitch;
  }

  const paths = queueStore.fileQueue.map((f) => f.path);
  await apiClient.startBatch(op, paths, params);
};

const runMerge = async () => {
  if (queueStore.fileQueue.length < 2) {
    message.warning(t("msg_merge_min_files"));
    return;
  }
  const paths = queueStore.fileQueue.map((f) => f.path);
  const params: any = { files: paths };
  if (configStore.config.output_dir) params.output_dir = configStore.config.output_dir;

  await apiClient.startOperation("merge_videos", paths[0], params);
};
</script>

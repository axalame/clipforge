<template>
  <div style="display:flex; flex-direction:column; gap:16px;">
    <div class="studio-subtabs">
      <button class="subtab-btn" :class="{ 'is-active': subExport === 'compress' }" @click="subExport = 'compress'">{{ t('sub_export_compress') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subExport === 'convert' }" @click="subExport = 'convert'">{{ t('sub_export_convert') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subExport === 'gif' }" @click="subExport = 'gif'">{{ t('sub_export_gif') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subExport === 'meta' }" @click="subExport = 'meta'">{{ t('sub_export_meta') }}</button>
    </div>

    <!-- Compress Form -->
    <div v-if="subExport === 'compress'" class="studio-panel">
      <div class="panel-header">
        <span>{{ compForm.mode === 'size' ? t('fit_size_title') : t('compress_title') }}</span>
      </div>

      <div style="margin-bottom:16px;">
        <div class="studio-subtabs" style="margin-bottom:0;">
          <button
            type="button"
            class="subtab-btn"
            :class="{ 'is-active': compForm.mode === 'crf' }"
            @click="compForm.mode = 'crf'"
          >
            {{ t('mode_crf') }}
          </button>
          <button
            type="button"
            class="subtab-btn"
            :class="{ 'is-active': compForm.mode === 'size' }"
            @click="compForm.mode = 'size'"
          >
            {{ t('mode_size') }}
          </button>
        </div>
      </div>

      <div class="form-grid-2" style="margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('video_codec_label') }}</label>
          <n-select v-model:value="compForm.codec" :options="codecOptions" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('speed_preset_label') }}</label>
          <n-select v-model:value="compForm.preset" :options="presetOptions" />
        </div>

        <div v-if="compForm.mode === 'crf'" class="form-field" style="grid-column: span 2;">
          <label class="field-label">{{ t('crf_level_label') }} {{ compForm.crf }} {{ t('crf_desc') }}</label>
          <n-slider v-model:value="compForm.crf" :min="16" :max="35" />
        </div>

        <div v-else class="form-field" style="grid-column: span 2;">
          <label class="field-label">{{ t('custom_size') }} (MB):</label>
          <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px;">
            <n-input-number v-model:value="compForm.target_size_mb" :min="1" :max="4000" style="width:140px;" />
            <span style="font-size:13px; color:var(--text-sub);">MB</span>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <n-button
              size="tiny"
              :secondary="compForm.target_size_mb !== 10"
              :type="compForm.target_size_mb === 10 ? 'primary' : 'default'"
              @click="compForm.target_size_mb = 10"
            >
              {{ t('preset_10mb') }}
            </n-button>
            <n-button
              size="tiny"
              :secondary="compForm.target_size_mb !== 25"
              :type="compForm.target_size_mb === 25 ? 'primary' : 'default'"
              @click="compForm.target_size_mb = 25"
            >
              {{ t('preset_25mb') }}
            </n-button>
            <n-button
              size="tiny"
              :secondary="compForm.target_size_mb !== 50"
              :type="compForm.target_size_mb === 50 ? 'primary' : 'default'"
              @click="compForm.target_size_mb = 50"
            >
              {{ t('preset_50mb') }}
            </n-button>
            <n-button
              size="tiny"
              :secondary="compForm.target_size_mb !== 100"
              :type="compForm.target_size_mb === 100 ? 'primary' : 'default'"
              @click="compForm.target_size_mb = 100"
            >
              {{ t('preset_100mb') }}
            </n-button>
          </div>
        </div>
      </div>
      <n-flex :size="10">
        <n-button type="primary" @click="runOp('compress')">{{ t('btn_compress_selected') }}</n-button>
        <n-button secondary @click="runBatch('compress')">{{ t('btn_compress_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- Convert Form -->
    <div v-if="subExport === 'convert'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('convert_title') }}</span>
      </div>
      <div class="form-grid-2" style="margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('target_container') }}</label>
          <n-select v-model:value="convForm.format" :options="containerOptions" />
        </div>
      </div>
      <n-flex :size="10">
        <n-button type="primary" @click="runOp('convert')">{{ t('btn_convert_selected') }}</n-button>
        <n-button secondary @click="runBatch('convert')">{{ t('btn_convert_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- GIF Form -->
    <div v-if="subExport === 'gif'" class="studio-panel">
      <div class="panel-header">
        <span>{{ gifForm.format === 'webp' ? t('webp_title') : t('gif_title') }}</span>
      </div>

      <div style="margin-bottom:16px;">
        <div class="studio-subtabs" style="margin-bottom:0;">
          <button
            type="button"
            class="subtab-btn"
            :class="{ 'is-active': gifForm.format === 'gif' }"
            @click="gifForm.format = 'gif'"
          >
            GIF
          </button>
          <button
            type="button"
            class="subtab-btn"
            :class="{ 'is-active': gifForm.format === 'webp' }"
            @click="gifForm.format = 'webp'"
          >
            WebP
          </button>
        </div>
      </div>

      <div class="form-grid-2" style="margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('gif_start') }} {{ gifForm.start }} {{ t('sec_unit') }}</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="gifForm.start" :min="0" :max="Math.max(30, queueStore.selectedMediaInfo?.duration || 120)" :step="0.5" style="flex:1;" />
            <n-input-number v-model:value="gifForm.start" :min="0" :step="0.5" style="width:90px;" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('gif_duration') }} {{ gifForm.duration }} {{ t('sec_unit') }}</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="gifForm.duration" :min="1" :max="30" :step="1" style="flex:1;" />
            <n-input-number v-model:value="gifForm.duration" :min="1" :max="60" style="width:90px;" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('anim_fps_label') }}</label>
          <n-select v-model:value="gifForm.fps" :options="fpsOptions" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('quality_res_label') }}</label>
          <n-select v-model:value="gifForm.quality" :options="gifQualityOptions" />
        </div>
      </div>
      <n-button type="primary" @click="runOp('create_gif')">
        {{ gifForm.format === 'webp' ? t('btn_webp_file') : t('btn_gif_file') }}
      </n-button>
    </div>

    <!-- Metadata Form -->
    <div v-if="subExport === 'meta'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('meta_title') }}</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:12px; margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('meta_work_title') }}</label>
          <n-input v-model:value="metaForm.title" :placeholder="t('meta_title_ph')" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('meta_artist') }}</label>
          <n-input v-model:value="metaForm.artist" :placeholder="t('meta_artist_ph')" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('meta_comment') }}</label>
          <n-input v-model:value="metaForm.comment" :placeholder="t('meta_comment_ph')" />
        </div>
      </div>
      <n-button type="primary" @click="runOp('apply_metadata')">{{ t('btn_meta_file') }}</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  NButton,
  NSlider,
  NInput,
  NInputNumber,
  NSelect,
  NFlex,
  useMessage,
} from "naive-ui";
import { useQueueStore } from "@/stores/queue";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";

const { t } = useI18n();
const message = useMessage();
const queueStore = useQueueStore();
const configStore = useConfigStore();

const subExport = ref<"compress" | "convert" | "gif" | "meta">("compress");

const compForm = ref({
  mode: "crf" as "crf" | "size",
  codec: "libx264",
  preset: "medium",
  crf: 23,
  target_size_mb: 25,
});

const convForm = ref({
  format: "mp4",
  fast: true,
});

const gifForm = ref({
  format: "gif" as "gif" | "webp",
  start: 0.0,
  duration: 5.0,
  quality: "480p",
  fps: 15,
});

const metaForm = ref({
  title: "",
  artist: "",
  comment: "",
});

const containerOptions = computed(() => [
  { label: "MP4 (H.264 / AAC)", value: "mp4" },
  { label: t("opt_container_mkv"), value: "mkv" },
  { label: "WEBM (VP9 / Opus)", value: "webm" },
]);

const codecOptions = computed(() => [
  { label: t("opt_codec_h264"), value: "libx264" },
  { label: t("opt_codec_h265"), value: "libx265" },
  { label: t("opt_codec_nvenc_h264"), value: "h264_nvenc" },
  { label: t("opt_codec_nvenc_hevc"), value: "hevc_nvenc" },
]);

const presetOptions = computed(() => [
  { label: t("opt_preset_ultrafast"), value: "ultrafast" },
  { label: t("opt_preset_fast"), value: "fast" },
  { label: t("opt_preset_medium"), value: "medium" },
  { label: t("opt_preset_slow"), value: "slow" },
  { label: t("opt_preset_veryslow"), value: "veryslow" },
]);

const fpsOptions = computed(() => [
  { label: "15 FPS", value: 15 },
  { label: "24 FPS", value: 24 },
  { label: "30 FPS", value: 30 },
]);

const gifQualityOptions = computed(() => [
  { label: t("gif_quality_320p"), value: "320p" },
  { label: t("gif_quality_480p"), value: "480p" },
  { label: t("gif_quality_720p"), value: "720p" },
]);

const buildParams = (op: string) => {
  const p: any = {};
  if (configStore.config.output_dir) p.output_dir = configStore.config.output_dir;

  if (op === "compress") {
    p.codec = compForm.value.codec;
    p.preset = compForm.value.preset;
    if (compForm.value.mode === "size") {
      p.target_size_mb = compForm.value.target_size_mb;
      p.duration = queueStore.selectedMediaInfo?.duration || 0;
    } else {
      p.crf = compForm.value.crf;
    }
  } else if (op === "convert") {
    p.format = convForm.value.format;
    p.fast = convForm.value.fast;
  } else if (op === "create_gif") {
    p.format = gifForm.value.format;
    p.start = gifForm.value.start;
    p.duration = gifForm.value.duration;
    p.quality = gifForm.value.quality;
    p.fps = gifForm.value.fps;
  } else if (op === "apply_metadata") {
    p.title = metaForm.value.title;
    p.artist = metaForm.value.artist;
    p.comment = metaForm.value.comment;
  }
  return p;
};

const runOp = async (op: string) => {
  if (!queueStore.activeFilePath) {
    message.warning(t("msg_select_first"));
    return;
  }
  const params = buildParams(op);
  if (!params) return;
  await apiClient.startOperation(op, queueStore.activeFilePath, params);
};

const runBatch = async (op: string) => {
  if (queueStore.fileQueue.length === 0) {
    message.warning(t("msg_queue_empty_batch"));
    return;
  }
  const params = buildParams(op);
  if (!params) return;
  const paths = queueStore.fileQueue.map((f) => f.path);
  await apiClient.startBatch(op, paths, params);
};
</script>

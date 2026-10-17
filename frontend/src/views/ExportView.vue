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
        <span>{{ t('compress_title') }}</span>
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
        <div class="form-field" style="grid-column: span 2;">
          <label class="field-label">{{ t('crf_level_label') }} {{ compForm.crf }} {{ t('crf_desc') }}</label>
          <n-slider v-model:value="compForm.crf" :min="16" :max="35" />
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
        <span>{{ t('gif_title') }}</span>
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
      </div>
      <n-button type="primary" @click="runOp('create_gif')">{{ t('btn_gif_file') }}</n-button>
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
  codec: "libx264",
  preset: "medium",
  crf: 23,
});

const convForm = ref({
  format: "mp4",
  fast: true,
});

const gifForm = ref({
  start: 0.0,
  duration: 5.0,
  quality: "480p",
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

const buildParams = (op: string) => {
  const p: any = {};
  if (configStore.config.output_dir) p.output_dir = configStore.config.output_dir;

  if (op === "compress") {
    p.codec = compForm.value.codec;
    p.preset = compForm.value.preset;
    p.crf = compForm.value.crf;
  } else if (op === "convert") {
    p.format = convForm.value.format;
    p.fast = convForm.value.fast;
  } else if (op === "create_gif") {
    p.start = gifForm.value.start;
    p.duration = gifForm.value.duration;
    p.quality = gifForm.value.quality;
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

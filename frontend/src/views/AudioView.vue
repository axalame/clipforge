<template>
  <div style="display:flex; flex-direction:column; gap:16px;">
    <div class="studio-subtabs">
      <button class="subtab-btn" :class="{ 'is-active': subAudio === 'loudnorm' }" @click="subAudio = 'loudnorm'">{{ t('sub_audio_loudnorm') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subAudio === 'silence' }" @click="subAudio = 'silence'">{{ t('sub_audio_silence') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subAudio === 'replace' }" @click="subAudio = 'replace'">{{ t('sub_audio_replace') }}</button>
    </div>

    <!-- Loudnorm -->
    <div v-if="subAudio === 'loudnorm'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('loudnorm_title') }}</span>
        <n-tag size="small" type="success" round>{{ t('loudnorm_target') }} {{ loudnormForm.i }} LUFS | TP: {{ loudnormForm.tp }} dB</n-tag>
      </div>

      <div style="font-size:13px; color:var(--text-muted); margin-bottom:16px;">
        {{ t('loudnorm_desc') }}
      </div>

      <!-- Presets -->
      <div class="form-field" style="margin-bottom:16px; background:var(--bg-panel-subtle); padding:12px; border-radius:6px; border:1px solid var(--border-color);">
        <label class="field-label">{{ t('loudnorm_presets_title') }}</label>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:6px;">
          <n-button size="small" :secondary="loudnormForm.preset !== '-14'" :type="loudnormForm.preset === '-14' ? 'primary' : 'default'" @click="onLoudnormPresetChange('-14')">
            YouTube / Reels / TikTok (-14 LUFS)
          </n-button>
          <n-button size="small" :secondary="loudnormForm.preset !== '-16'" :type="loudnormForm.preset === '-16' ? 'primary' : 'default'" @click="onLoudnormPresetChange('-16')">
            {{ t('preset_podcast') }}
          </n-button>
          <n-button size="small" :secondary="loudnormForm.preset !== '-23'" :type="loudnormForm.preset === '-23' ? 'primary' : 'default'" @click="onLoudnormPresetChange('-23')">
            {{ t('preset_ebu') }}
          </n-button>
          <n-button size="small" :secondary="loudnormForm.preset !== '-24'" :type="loudnormForm.preset === '-24' ? 'primary' : 'default'" @click="onLoudnormPresetChange('-24')">
            {{ t('preset_atsc') }}
          </n-button>
        </div>
      </div>

      <!-- Fine-tune parameters -->
      <div class="form-grid-2" style="margin-bottom:18px;">
        <div class="form-field">
          <label class="field-label">{{ t('loudnorm_i_label') }} {{ loudnormForm.i }} LUFS</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="loudnormForm.i" :min="-35" :max="-10" :step="0.5" style="flex:1;" />
            <n-input-number v-model:value="loudnormForm.i" :min="-70" :max="-5" :step="0.5" style="width:110px;" />
          </div>
          <div style="font-size:11px; color:var(--text-sub); margin-top:3px;">
            {{ t('loudnorm_i_desc') }}
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">{{ t('loudnorm_tp_label') }} {{ loudnormForm.tp }} dBFS</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="loudnormForm.tp" :min="-6" :max="0" :step="0.1" style="flex:1;" />
            <n-input-number v-model:value="loudnormForm.tp" :min="-9" :max="0" :step="0.1" style="width:110px;" />
          </div>
          <div style="font-size:11px; color:var(--text-sub); margin-top:3px;">
            {{ t('loudnorm_tp_desc') }}
          </div>
        </div>

        <div class="form-field" style="grid-column: span 2;">
          <label class="field-label">{{ t('loudnorm_lra_label') }} {{ loudnormForm.lra }} LU</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="loudnormForm.lra" :min="3" :max="25" :step="0.5" style="flex:1;" />
            <n-input-number v-model:value="loudnormForm.lra" :min="1" :max="50" :step="0.5" style="width:110px;" />
          </div>
          <div style="font-size:11px; color:var(--text-sub); margin-top:3px;">
            {{ t('loudnorm_lra_desc') }}
          </div>
        </div>
      </div>

      <n-flex :size="10">
        <n-button type="primary" @click="runOp('normalize_audio')">{{ t('btn_norm_file') }}</n-button>
        <n-button secondary @click="runBatch('normalize_audio')">{{ t('btn_norm_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- Remove Silence -->
    <div v-if="subAudio === 'silence'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('silence_title') }}</span>
      </div>
      <div class="form-grid-2" style="margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('silence_thresh') }} {{ silenceForm.threshold_db }} dB</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="silenceForm.threshold_db" :min="-60" :max="-10" :step="1" style="flex:1;" />
            <n-input-number v-model:value="silenceForm.threshold_db" :min="-80" :max="-5" style="width:90px;" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('silence_dur') }} {{ silenceForm.min_duration }} {{ t('sec_unit') }}</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="silenceForm.min_duration" :min="0.2" :max="5.0" :step="0.1" style="flex:1;" />
            <n-input-number v-model:value="silenceForm.min_duration" :min="0.1" :max="30" :step="0.1" style="width:90px;" />
          </div>
        </div>
      </div>
      <n-flex :size="10">
        <n-button type="primary" @click="runOp('remove_silence')">{{ t('btn_silence_file') }}</n-button>
        <n-button secondary @click="runBatch('remove_silence')">{{ t('btn_silence_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- Replace Audio -->
    <div v-if="subAudio === 'replace'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('replace_audio_title') }}</span>
      </div>
      <div class="form-field" style="margin-bottom:16px;">
        <label class="field-label">{{ t('new_audio_label') }}</label>
        <n-flex align="center" :size="8">
          <n-input v-model:value="audioForm.path" :placeholder="t('choose_audio_file')" style="flex:1;" />
          <n-button secondary @click="pickAudio">{{ t('browse') }}</n-button>
        </n-flex>
      </div>
      <n-button type="primary" @click="runOp('replace_audio')">{{ t('btn_replace_audio') }}</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  NButton,
  NSlider,
  NInput,
  NInputNumber,
  NTag,
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

const subAudio = ref<"loudnorm" | "silence" | "replace">("loudnorm");

const loudnormForm = ref({
  preset: "-14",
  i: -14.0,
  tp: -1.0,
  lra: 11.0,
});

const silenceForm = ref({
  threshold_db: -30,
  min_duration: 1.5,
});

const audioForm = ref({
  path: "",
});

const onLoudnormPresetChange = (preset: string) => {
  loudnormForm.value.preset = preset;
  if (preset === "-14") {
    loudnormForm.value.i = -14.0;
    loudnormForm.value.tp = -1.0;
    loudnormForm.value.lra = 11.0;
  } else if (preset === "-16") {
    loudnormForm.value.i = -16.0;
    loudnormForm.value.tp = -1.5;
    loudnormForm.value.lra = 11.0;
  } else if (preset === "-23") {
    loudnormForm.value.i = -23.0;
    loudnormForm.value.tp = -1.0;
    loudnormForm.value.lra = 7.0;
  } else if (preset === "-24") {
    loudnormForm.value.i = -24.0;
    loudnormForm.value.tp = -2.0;
    loudnormForm.value.lra = 7.0;
  }
};

const pickAudio = async () => {
  const p = await apiClient.selectAudioFile();
  if (p) audioForm.value.path = p;
};

const buildParams = (op: string) => {
  const p: any = {};
  if (configStore.config.output_dir) p.output_dir = configStore.config.output_dir;

  if (op === "normalize_audio") {
    p.i = loudnormForm.value.i;
    p.tp = loudnormForm.value.tp;
    p.lra = loudnormForm.value.lra;
  } else if (op === "remove_silence") {
    p.threshold_db = silenceForm.value.threshold_db;
    p.min_duration = silenceForm.value.min_duration;
  } else if (op === "replace_audio") {
    if (!audioForm.value.path) {
      message.error(t("msg_no_audio_file"));
      return null;
    }
    p.audio_file = audioForm.value.path;
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

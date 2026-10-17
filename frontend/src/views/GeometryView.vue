<template>
  <div style="display:flex; flex-direction:column; gap:16px;">
    <div class="studio-subtabs">
      <button class="subtab-btn" :class="{ 'is-active': subGeom === 'crop' }" @click="subGeom = 'crop'">{{ t('sub_geom_crop') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subGeom === 'resize' }" @click="subGeom = 'resize'">{{ t('sub_geom_resize') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subGeom === 'rotate' }" @click="subGeom = 'rotate'">{{ t('sub_geom_rotate') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subGeom === 'fps' }" @click="subGeom = 'fps'">{{ t('sub_geom_fps') }}</button>
    </div>

    <!-- 1. Crop Form with Live Interactive Stage -->
    <div v-if="subGeom === 'crop'" style="display:flex; flex-direction:column; gap:16px;">
      <div class="interactive-stage-card">
        <div class="stage-header">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="stage-title">{{ t('crop_interactive_title') }}</span>
            <n-tag size="tiny" type="success" round>{{ t('realtime_selection') }}</n-tag>
          </div>
          <div style="font-size:11px; color:var(--text-sub);">
            {{ t('crop_hint') }}
          </div>
        </div>

        <div class="stage-outer-wrapper">
          <div
            class="interactive-viewport"
            :style="viewportStyle"
            ref="stageRef"
            @mousedown="onStageMouseDown"
          >
            <video
              v-show="queueStore.activeVideoSrc && !queueStore.hasVideoError"
              id="interactive-crop-video"
              :src="queueStore.activeVideoSrc"
              :poster="queueStore.activeFrameSrc"
              class="stage-video"
              playsinline
              muted
              loop
              @error="onVideoError"
            ></video>

            <img
              v-if="queueStore.activeFrameSrc && queueStore.hasVideoError"
              :src="queueStore.activeFrameSrc"
              class="stage-video"
              style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; pointer-events:none;"
            />

            <div v-if="!queueStore.activeVideoSrc" class="stage-placeholder-grid">
              <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position:absolute; inset:0;">
                <defs>
                  <pattern id="cropgrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#cropgrid)" />
              </svg>
              <div class="placeholder-hint">
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="1.8" fill="none" style="flex-shrink:0;">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <span>{{ t('crop_canvas_placeholder') }}</span>
              </div>
            </div>

            <!-- Interactive Crop Box with Rule-of-Thirds Grid -->
            <div
              class="stage-overlay-item is-crop"
              :style="cropBoxStyle"
              @mousedown.stop="onStartMoveCrop"
              :title="t('crop_box_tooltip')"
            >
              <div class="crop-rule-of-thirds">
                <div></div><div></div><div></div>
                <div></div><div></div><div></div>
                <div></div><div></div><div></div>
              </div>
              <div class="stage-crop-badge">
                {{ t('crop_frame_tag') }} {{ cropForm.width }}×{{ cropForm.height }} px (X: {{ cropForm.x }}, Y: {{ cropForm.y }})
              </div>
              <div class="handle-br is-crop-handle" @mousedown.stop="onStartResizeCrop"></div>
            </div>

            <!-- Play / Pause video button on canvas if active video -->
            <div v-if="queueStore.activeVideoSrc" class="stage-video-toolbar">
              <button class="stage-play-btn" @click.stop="toggleStagePlayback" :title="t('play_pause_tooltip')">
                <svg v-if="!isStagePlaying" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
                <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
              </button>
              <span class="stage-timecode">{{ t('preview_badge') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="studio-panel">
        <div class="panel-header">
          <span>{{ t('crop_params_title') }}</span>
          <n-tag size="small" type="success" round>
            {{ cropForm.width }}×{{ cropForm.height }} px (X: {{ cropForm.x }}, Y: {{ cropForm.y }})
          </n-tag>
        </div>
        <div class="form-grid-2" style="margin-bottom:16px;">
          <div class="form-field">
            <label class="field-label">{{ t('offset_x') }}</label>
            <n-input-number v-model:value="cropForm.x" :min="0" style="width:100%;" />
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('offset_y') }}</label>
            <n-input-number v-model:value="cropForm.y" :min="0" style="width:100%;" />
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('frame_width') }}</label>
            <n-input-number v-model:value="cropForm.width" :min="32" style="width:100%;" />
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('frame_height') }}</label>
            <n-input-number v-model:value="cropForm.height" :min="32" style="width:100%;" />
          </div>
        </div>
        <n-flex :size="10">
          <n-button type="primary" @click="runOp('crop')">{{ t('btn_crop_file') }}</n-button>
          <n-button secondary @click="runBatch('crop')">{{ t('btn_crop_queue') }}</n-button>
        </n-flex>
      </div>
    </div>

    <!-- 2. Resize Form -->
    <div v-if="subGeom === 'resize'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('resize_title') }}</span>
      </div>
      <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px;">
        <n-button size="tiny" secondary @click="resizeForm.width = 1920; resizeForm.height = 1080">1080p Full HD (1920×1080)</n-button>
        <n-button size="tiny" secondary @click="resizeForm.width = 1280; resizeForm.height = 720">720p HD (1280×720)</n-button>
        <n-button size="tiny" secondary @click="resizeForm.width = 854; resizeForm.height = 480">480p SD (854×480)</n-button>
        <n-button size="tiny" secondary @click="resizeForm.width = 1080; resizeForm.height = 1920">{{ t('preset_vertical') }}</n-button>
        <n-button size="tiny" secondary @click="resizeForm.width = 1080; resizeForm.height = 1080">{{ t('preset_square') }}</n-button>
      </div>
      <div class="form-grid-2" style="margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('width_label') }} {{ resizeForm.width }} px</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="resizeForm.width" :min="240" :max="3840" :step="2" style="flex:1;" />
            <n-input-number v-model:value="resizeForm.width" :min="120" style="width:100px;" />
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('height_label') }} {{ resizeForm.height }} px</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="resizeForm.height" :min="240" :max="2160" :step="2" style="flex:1;" />
            <n-input-number v-model:value="resizeForm.height" :min="120" style="width:100px;" />
          </div>
        </div>
      </div>
      <n-flex :size="10">
        <n-button type="primary" @click="runOp('resize')">{{ t('btn_resize_file') }}</n-button>
        <n-button secondary @click="runBatch('resize')">{{ t('btn_resize_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- 3. Rotate Form -->
    <div v-if="subGeom === 'rotate'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('rotate_title') }}</span>
      </div>
      <div style="display:flex; gap:10px; margin-bottom:16px;">
        <n-button :secondary="rotateForm.angle !== 90" :type="rotateForm.angle === 90 ? 'primary' : 'default'" @click="rotateForm.angle = 90">{{ t('rot_90_cw') }}</n-button>
        <n-button :secondary="rotateForm.angle !== 180" :type="rotateForm.angle === 180 ? 'primary' : 'default'" @click="rotateForm.angle = 180">{{ t('rot_180') }}</n-button>
        <n-button :secondary="rotateForm.angle !== 270" :type="rotateForm.angle === 270 ? 'primary' : 'default'" @click="rotateForm.angle = 270">{{ t('rot_270') }}</n-button>
      </div>
      <n-flex :size="10">
        <n-button type="primary" @click="runOp('rotate')">{{ t('btn_rotate_file') }}</n-button>
        <n-button secondary @click="runBatch('rotate')">{{ t('btn_rotate_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- 4. FPS Form -->
    <div v-if="subGeom === 'fps'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('fps_title') }}</span>
      </div>
      <div class="form-field" style="max-width:480px; margin-bottom:16px;">
        <label class="field-label">{{ t('target_fps') }} {{ fpsForm.fps }} FPS</label>
        <div style="display:flex; gap:10px; align-items:center;">
          <n-slider v-model:value="fpsForm.fps" :min="10" :max="120" :step="1" style="flex:1;" />
          <n-input-number v-model:value="fpsForm.fps" :min="1" :max="240" style="width:90px;" />
        </div>
        <div style="display:flex; gap:6px; margin-top:8px;">
          <n-button size="tiny" secondary @click="fpsForm.fps = 24">{{ t('fps_24') }}</n-button>
          <n-button size="tiny" secondary @click="fpsForm.fps = 30">{{ t('fps_30') }}</n-button>
          <n-button size="tiny" secondary @click="fpsForm.fps = 60">{{ t('fps_60') }}</n-button>
          <n-button size="tiny" secondary @click="fpsForm.fps = 120">120 FPS (High-rate)</n-button>
        </div>
      </div>
      <n-flex :size="10">
        <n-button type="primary" @click="runOp('change_fps')">{{ t('btn_fps_file') }}</n-button>
        <n-button secondary @click="runBatch('change_fps')">{{ t('btn_fps_queue') }}</n-button>
      </n-flex>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";
import { useI18n } from "vue-i18n";
import {
  NButton,
  NSlider,
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

const subGeom = ref<"crop" | "resize" | "rotate" | "fps">("crop");
const stageRef = ref<HTMLElement | null>(null);
const stageMode = ref<string>("");
const dragStart = ref({ x: 0, y: 0, mouseX: 0, mouseY: 0, initX: 0, initY: 0, initW: 0, initH: 0 });
const isStagePlaying = ref<boolean>(false);

const cropForm = ref({ x: 0, y: 0, width: 640, height: 360, use_exact: true });
const resizeForm = ref({ width: 1280, height: 720, keep_aspect: true });
const rotateForm = ref({ angle: 90 });
const fpsForm = ref({ fps: 30 });

const getVideoDims = () => {
  const w = queueStore.selectedMediaInfo?.video?.width || 1280;
  const h = queueStore.selectedMediaInfo?.video?.height || 720;
  return { w, h };
};

const viewportStyle = computed(() => {
  const { w, h } = getVideoDims();
  const aspect = w / h;
  if (aspect > 2.2) {
    return {
      aspectRatio: `${w} / ${h}`,
      width: "100%",
      height: "auto",
      maxHeight: "100%",
    };
  }
  return {
    aspectRatio: `${w} / ${h}`,
    height: "100%",
    width: "auto",
    maxWidth: "100%",
  };
});

const cropBoxStyle = computed(() => {
  const { w: vW, h: vH } = getVideoDims();
  const left = (cropForm.value.x / vW) * 100;
  const top = (cropForm.value.y / vH) * 100;
  const width = (cropForm.value.width / vW) * 100;
  const height = (cropForm.value.height / vH) * 100;
  return {
    left: Math.max(0, Math.min(100, left)) + "%",
    top: Math.max(0, Math.min(100, top)) + "%",
    width: Math.max(0, Math.min(100, width)) + "%",
    height: Math.max(0, Math.min(100, height)) + "%",
  };
});

const onStageMouseDown = (e: MouseEvent) => {
  if (!stageRef.value) return;
  const rect = stageRef.value.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  stageMode.value = "draw_crop";
  dragStart.value = { x: clickX, y: clickY, mouseX: e.clientX, mouseY: e.clientY, initX: 0, initY: 0, initW: 0, initH: 0 };
  const { w: vW, h: vH } = getVideoDims();
  cropForm.value.x = Math.round((clickX / rect.width) * vW);
  cropForm.value.y = Math.round((clickY / rect.height) * vH);
  cropForm.value.width = 64;
  cropForm.value.height = 64;
  cropForm.value.use_exact = true;
};

const onStartMoveCrop = (e: MouseEvent) => {
  stageMode.value = "move_crop";
  dragStart.value = {
    x: 0,
    y: 0,
    mouseX: e.clientX,
    mouseY: e.clientY,
    initX: cropForm.value.x,
    initY: cropForm.value.y,
    initW: 0,
    initH: 0,
  };
};

const onStartResizeCrop = (e: MouseEvent) => {
  stageMode.value = "resize_crop";
  dragStart.value = {
    x: 0,
    y: 0,
    mouseX: e.clientX,
    mouseY: e.clientY,
    initX: 0,
    initY: 0,
    initW: cropForm.value.width,
    initH: cropForm.value.height,
  };
};

const onGlobalMouseMove = (e: MouseEvent) => {
  if (!stageMode.value || !stageRef.value) return;
  const rect = stageRef.value.getBoundingClientRect();
  const { w: vW, h: vH } = getVideoDims();

  if (stageMode.value === "draw_crop") {
    const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const boxX = Math.min(dragStart.value.x, curX);
    const boxY = Math.min(dragStart.value.y, curY);
    const boxW = Math.max(32, Math.abs(curX - dragStart.value.x));
    const boxH = Math.max(32, Math.abs(curY - dragStart.value.y));

    let rx = Math.round((boxX / rect.width) * vW);
    let ry = Math.round((boxY / rect.height) * vH);
    let rw = Math.round((boxW / rect.width) * vW);
    let rh = Math.round((boxH / rect.height) * vH);

    rw = Math.max(32, rw - (rw % 2));
    rh = Math.max(32, rh - (rh % 2));
    rx = Math.max(0, Math.min(vW - rw, rx));
    ry = Math.max(0, Math.min(vH - rh, ry));

    cropForm.value.x = rx;
    cropForm.value.y = ry;
    cropForm.value.width = rw;
    cropForm.value.height = rh;
    cropForm.value.use_exact = true;
  } else if (stageMode.value === "move_crop") {
    const dx = ((e.clientX - dragStart.value.mouseX) / rect.width) * vW;
    const dy = ((e.clientY - dragStart.value.mouseY) / rect.height) * vH;
    let nx = Math.round(dragStart.value.initX + dx);
    let ny = Math.round(dragStart.value.initY + dy);
    nx = Math.max(0, Math.min(vW - cropForm.value.width, nx));
    ny = Math.max(0, Math.min(vH - cropForm.value.height, ny));
    cropForm.value.x = nx;
    cropForm.value.y = ny;
    cropForm.value.use_exact = true;
  } else if (stageMode.value === "resize_crop") {
    const dw = ((e.clientX - dragStart.value.mouseX) / rect.width) * vW;
    const dh = ((e.clientY - dragStart.value.mouseY) / rect.height) * vH;
    let nw = Math.round(dragStart.value.initW + dw);
    let nh = Math.round(dragStart.value.initH + dh);
    nw = Math.max(32, Math.min(vW - cropForm.value.x, nw));
    nh = Math.max(32, Math.min(vH - cropForm.value.y, nh));
    nw = nw - (nw % 2);
    nh = nh - (nh % 2);
    cropForm.value.width = nw;
    cropForm.value.height = nh;
    cropForm.value.use_exact = true;
  }
};

const onGlobalMouseUp = () => {
  stageMode.value = "";
};

const toggleStagePlayback = () => {
  const v = document.getElementById("interactive-crop-video") as HTMLVideoElement | null;
  if (!v) return;
  if (v.paused) {
    v.play();
    isStagePlaying.value = true;
  } else {
    v.pause();
    isStagePlaying.value = false;
  }
};

const onVideoError = () => {
  queueStore.hasVideoError = true;
};

const startListeners = () => {
  window.addEventListener("mousemove", onGlobalMouseMove);
  window.addEventListener("mouseup", onGlobalMouseUp);
};

const stopListeners = () => {
  window.removeEventListener("mousemove", onGlobalMouseMove);
  window.removeEventListener("mouseup", onGlobalMouseUp);
};

onMounted(() => {
  startListeners();
  const dims = getVideoDims();
  cropForm.value.width = dims.w;
  cropForm.value.height = dims.h;
  resizeForm.value.width = dims.w;
  resizeForm.value.height = dims.h;
});

onActivated(() => {
  startListeners();
});

onDeactivated(() => {
  stopListeners();
});

onUnmounted(() => {
  stopListeners();
});

const runOp = async (op: string) => {
  if (!queueStore.activeFilePath) {
    message.warning(t("msg_select_first"));
    return;
  }
  const params: any = {};
  if (configStore.config.output_dir) params.output_dir = configStore.config.output_dir;

  if (op === "crop") {
    params.width = cropForm.value.width;
    params.height = cropForm.value.height;
    params.x = cropForm.value.x;
    params.y = cropForm.value.y;
  } else if (op === "resize") {
    params.width = resizeForm.value.width;
    params.height = resizeForm.value.height;
    params.keep_aspect = resizeForm.value.keep_aspect;
  } else if (op === "rotate") {
    params.angle = rotateForm.value.angle;
  } else if (op === "change_fps") {
    params.fps = fpsForm.value.fps;
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

  if (op === "crop") {
    params.width = cropForm.value.width;
    params.height = cropForm.value.height;
    params.x = cropForm.value.x;
    params.y = cropForm.value.y;
  } else if (op === "resize") {
    params.width = resizeForm.value.width;
    params.height = resizeForm.value.height;
    params.keep_aspect = resizeForm.value.keep_aspect;
  } else if (op === "rotate") {
    params.angle = rotateForm.value.angle;
  } else if (op === "change_fps") {
    params.fps = fpsForm.value.fps;
  }

  const paths = queueStore.fileQueue.map((f) => f.path);
  await apiClient.startBatch(op, paths, params);
};
</script>

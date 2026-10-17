import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NSlider, NInput, NInputNumber, NTag, NFlex, NSwitch, NColorPicker, useMessage, } from "naive-ui";
import { useQueueStore } from "@/stores/queue";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";
const { t } = useI18n();
const message = useMessage();
const queueStore = useQueueStore();
const configStore = useConfigStore();
const subFx = ref("watermark");
const colorPresets = ["#ffffff", "#facc15", "#ef4444", "#10b981", "#38bdf8", "#a855f7", "#000000"];
const currentClock = ref(new Date());
let clockTimer = null;
const liveFormattedTimestamp = computed(() => {
    const d = currentClock.value || new Date();
    const fmt = tsForm.value?.format || "%Y-%m-%d %H:%M:%S";
    if (fmt.includes("pts") || fmt.includes("hms")) {
        return "00:00:00.00";
    }
    const Y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const H = String(d.getHours()).padStart(2, "0");
    const M = String(d.getMinutes()).padStart(2, "0");
    const S = String(d.getSeconds()).padStart(2, "0");
    return fmt
        .replace(/%Y/g, String(Y))
        .replace(/%m/g, m)
        .replace(/%d/g, day)
        .replace(/%H/g, H)
        .replace(/%M/g, M)
        .replace(/%S/g, S)
        .replace(/%X/g, `${H}:${M}:${S}`)
        .replace(/%T/g, `${H}:${M}:${S}`);
});
// Forms
const wmForm = ref({
    path: "",
    opacity: 80,
    size: 20,
    position: "bottom-right",
    x_pct: 95,
    y_pct: 95,
});
const textForm = ref({
    text: "",
    fontsize: 36,
    color: "#ffffff",
    use_box: false,
    position: "bottom-center",
    x_pct: 50,
    y_pct: 90,
});
const tsForm = ref({
    format: "%Y-%m-%d %H:%M:%S",
    fontsize: 32,
    color: "#ffffff",
    use_box: true,
    position: "bottom-right",
    x_pct: 95,
    y_pct: 95,
});
const blurForm = ref({
    effect: "blur",
    x: 100,
    y: 100,
    w: 200,
    h: 200,
    intensity: 50,
});
const pipForm = ref({
    path: "",
    scale: 30,
    position: "top-right",
    x_pct: 85,
    y_pct: 15,
});
const stageRef = ref(null);
const stageMode = ref(null);
const dragStart = ref({});
const wmNaturalAspect = ref(1.0);
const isStagePlaying = ref(false);
const activeWatermarkSrc = computed(() => {
    if (wmForm.value.path) {
        return `/image?path=${encodeURIComponent(wmForm.value.path)}`;
    }
    return "";
});
const getVideoDims = () => {
    const vid = queueStore.selectedMediaInfo?.video;
    return {
        w: vid?.width || 1280,
        h: vid?.height || 720,
    };
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
const wmBoxStyle = computed(() => {
    const { w: vW, h: vH } = getVideoDims();
    const widthPct = Math.max(5, Math.min(100, Number(wmForm.value.size) || 20));
    const aspect = wmNaturalAspect.value > 0 ? wmNaturalAspect.value : 1.0;
    const heightPct = ((vW * (widthPct / 100)) / aspect / vH) * 100;
    const xp = Math.max(0, Math.min(100, Number(wmForm.value.x_pct) || 0)) / 100;
    const yp = Math.max(0, Math.min(100, Number(wmForm.value.y_pct) || 0)) / 100;
    const leftPct = (100 - widthPct) * xp;
    const topPct = (100 - heightPct) * yp;
    return {
        left: `${leftPct}%`,
        top: `${topPct}%`,
        width: `${widthPct}%`,
        height: `${heightPct}%`,
        opacity: (Number(wmForm.value.opacity) || 80) / 100,
    };
});
const blurBoxStyle = computed(() => {
    const { w: vW, h: vH } = getVideoDims();
    const left = (blurForm.value.x / vW) * 100;
    const top = (blurForm.value.y / vH) * 100;
    const width = (blurForm.value.w / vW) * 100;
    const height = (blurForm.value.h / vH) * 100;
    const intensity = Number(blurForm.value.intensity) || 50;
    if (blurForm.value.effect === "pixelate") {
        const pixelSize = Math.max(4, Math.round(intensity / 4));
        return {
            left: Math.max(0, Math.min(100, left)) + "%",
            top: Math.max(0, Math.min(100, top)) + "%",
            width: Math.max(0, Math.min(100, width)) + "%",
            height: Math.max(0, Math.min(100, height)) + "%",
            backdropFilter: "blur(1px)",
            backgroundImage: `linear-gradient(to right, rgba(245, 158, 11, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 158, 11, 0.45) 1px, transparent 1px), repeating-conic-gradient(rgba(0,0,0,0.45) 0% 25%, rgba(255,255,255,0.06) 0% 50%)`,
            backgroundSize: `${pixelSize}px ${pixelSize}px, ${pixelSize}px ${pixelSize}px, ${pixelSize * 2}px ${pixelSize * 2}px`,
            border: "2px dashed #f59e0b",
            boxShadow: "0 0 14px rgba(245, 158, 11, 0.45)",
        };
    }
    else {
        const blurRadius = Math.max(2, Math.round(intensity / 3.5));
        return {
            left: Math.max(0, Math.min(100, left)) + "%",
            top: Math.max(0, Math.min(100, top)) + "%",
            width: Math.max(0, Math.min(100, width)) + "%",
            height: Math.max(0, Math.min(100, height)) + "%",
            backdropFilter: `blur(${blurRadius}px)`,
            background: "rgba(56, 189, 248, 0.2)",
            border: "2px dashed #38bdf8",
            boxShadow: "0 0 14px rgba(56, 189, 248, 0.4)",
        };
    }
});
const onWatermarkImgLoad = (e) => {
    const img = e.target;
    if (img.naturalWidth && img.naturalHeight) {
        wmNaturalAspect.value = img.naturalWidth / img.naturalHeight;
    }
};
const setWmPreset = (pos) => {
    wmForm.value.position = pos;
    const map = {
        "top-left": { x: 5, y: 5 },
        "top-center": { x: 50, y: 5 },
        "top-right": { x: 95, y: 5 },
        "center-left": { x: 5, y: 50 },
        "center": { x: 50, y: 50 },
        "center-right": { x: 95, y: 50 },
        "bottom-left": { x: 5, y: 95 },
        "bottom-center": { x: 50, y: 95 },
        "bottom-right": { x: 95, y: 95 },
    };
    if (map[pos]) {
        wmForm.value.x_pct = map[pos].x;
        wmForm.value.y_pct = map[pos].y;
    }
};
const setTextPreset = (pos) => {
    textForm.value.position = pos;
    const map = {
        "top-left": { x: 15, y: 10 },
        "top-center": { x: 50, y: 10 },
        "top-right": { x: 85, y: 10 },
        "center-left": { x: 15, y: 50 },
        "center": { x: 50, y: 50 },
        "center-right": { x: 85, y: 50 },
        "bottom-left": { x: 15, y: 90 },
        "bottom-center": { x: 50, y: 90 },
        "bottom-right": { x: 85, y: 90 },
    };
    if (map[pos]) {
        textForm.value.x_pct = map[pos].x;
        textForm.value.y_pct = map[pos].y;
    }
};
const onStageMouseDown = (e) => {
    if (!stageRef.value)
        return;
    const rect = stageRef.value.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    if (subFx.value === "blur") {
        stageMode.value = "draw_blur";
        dragStart.value = { x: clickX, y: clickY };
        const { w: vW, h: vH } = getVideoDims();
        blurForm.value.x = Math.round((clickX / rect.width) * vW);
        blurForm.value.y = Math.round((clickY / rect.height) * vH);
        blurForm.value.w = 40;
        blurForm.value.h = 40;
    }
    else if (subFx.value === "watermark") {
        stageMode.value = "drag_wm";
        wmForm.value.x_pct = Math.round(Math.max(0, Math.min(100, (clickX / rect.width) * 100)));
        wmForm.value.y_pct = Math.round(Math.max(0, Math.min(100, (clickY / rect.height) * 100)));
        wmForm.value.position = "custom";
    }
    else if (subFx.value === "text") {
        stageMode.value = "drag_text";
        textForm.value.x_pct = Math.round(Math.max(5, Math.min(95, (clickX / rect.width) * 100)));
        textForm.value.y_pct = Math.round(Math.max(5, Math.min(95, (clickY / rect.height) * 100)));
        textForm.value.position = "custom";
    }
    else if (subFx.value === "timestamp") {
        stageMode.value = "drag_ts";
        tsForm.value.x_pct = Math.round(Math.max(5, Math.min(95, (clickX / rect.width) * 100)));
        tsForm.value.y_pct = Math.round(Math.max(5, Math.min(95, (clickY / rect.height) * 100)));
        tsForm.value.position = "custom";
    }
    else if (subFx.value === "pip") {
        stageMode.value = "drag_pip";
        pipForm.value.x_pct = Math.round(Math.max(10, Math.min(90, (clickX / rect.width) * 100)));
        pipForm.value.y_pct = Math.round(Math.max(10, Math.min(90, (clickY / rect.height) * 100)));
        pipForm.value.position = "custom";
    }
};
const onStartDragWatermark = () => { stageMode.value = "drag_wm"; };
const onStartDragText = () => { stageMode.value = "drag_text"; };
const onStartDragTimestamp = () => { stageMode.value = "drag_ts"; };
const onStartDragPip = () => { stageMode.value = "drag_pip"; };
const onStartMoveBlur = (e) => {
    stageMode.value = "move_blur";
    dragStart.value = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        initX: blurForm.value.x,
        initY: blurForm.value.y,
    };
};
const onStartResizeBlur = (e) => {
    stageMode.value = "resize_blur";
    dragStart.value = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        initW: blurForm.value.w,
        initH: blurForm.value.h,
    };
};
const onGlobalMouseMove = (e) => {
    if (!stageMode.value || !stageRef.value)
        return;
    const rect = stageRef.value.getBoundingClientRect();
    const { w: vW, h: vH } = getVideoDims();
    if (stageMode.value === "drag_wm") {
        const px = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
        const py = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
        wmForm.value.x_pct = px;
        wmForm.value.y_pct = py;
        wmForm.value.position = "custom";
    }
    else if (stageMode.value === "drag_text") {
        textForm.value.x_pct = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
        textForm.value.y_pct = Math.round(Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100)));
        textForm.value.position = "custom";
    }
    else if (stageMode.value === "drag_ts") {
        tsForm.value.x_pct = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
        tsForm.value.y_pct = Math.round(Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100)));
        tsForm.value.position = "custom";
    }
    else if (stageMode.value === "drag_pip") {
        pipForm.value.x_pct = Math.round(Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100)));
        pipForm.value.y_pct = Math.round(Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100)));
        pipForm.value.position = "custom";
    }
    else if (stageMode.value === "draw_blur") {
        const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
        const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
        const boxX = Math.min(dragStart.value.x || 0, curX);
        const boxY = Math.min(dragStart.value.y || 0, curY);
        const boxW = Math.max(16, Math.abs(curX - (dragStart.value.x || 0)));
        const boxH = Math.max(16, Math.abs(curY - (dragStart.value.y || 0)));
        let rx = Math.round((boxX / rect.width) * vW);
        let ry = Math.round((boxY / rect.height) * vH);
        let rw = Math.round((boxW / rect.width) * vW);
        let rh = Math.round((boxH / rect.height) * vH);
        rw = Math.max(16, rw - (rw % 2));
        rh = Math.max(16, rh - (rh % 2));
        rx = Math.max(0, Math.min(vW - rw, rx));
        ry = Math.max(0, Math.min(vH - rh, ry));
        blurForm.value.x = rx;
        blurForm.value.y = ry;
        blurForm.value.w = rw;
        blurForm.value.h = rh;
    }
    else if (stageMode.value === "move_blur") {
        const dx = ((e.clientX - (dragStart.value.mouseX || 0)) / rect.width) * vW;
        const dy = ((e.clientY - (dragStart.value.mouseY || 0)) / rect.height) * vH;
        let nx = Math.round((dragStart.value.initX || 0) + dx);
        let ny = Math.round((dragStart.value.initY || 0) + dy);
        nx = Math.max(0, Math.min(vW - blurForm.value.w, nx));
        ny = Math.max(0, Math.min(vH - blurForm.value.h, ny));
        blurForm.value.x = nx;
        blurForm.value.y = ny;
    }
    else if (stageMode.value === "resize_blur") {
        const dw = ((e.clientX - (dragStart.value.mouseX || 0)) / rect.width) * vW;
        const dh = ((e.clientY - (dragStart.value.mouseY || 0)) / rect.height) * vH;
        let nw = Math.round((dragStart.value.initW || 0) + dw);
        let nh = Math.round((dragStart.value.initH || 0) + dh);
        nw = Math.max(16, Math.min(vW - blurForm.value.x, nw));
        nh = Math.max(16, Math.min(vH - blurForm.value.y, nh));
        nw = nw - (nw % 2);
        nh = nh - (nh % 2);
        blurForm.value.w = nw;
        blurForm.value.h = nh;
    }
};
const onGlobalMouseUp = () => {
    stageMode.value = null;
};
const toggleStagePlayback = () => {
    const v = document.getElementById("interactive-canvas-video");
    if (!v)
        return;
    if (v.paused) {
        v.play();
        isStagePlaying.value = true;
    }
    else {
        v.pause();
        isStagePlaying.value = false;
    }
};
const onVideoError = () => {
    queueStore.hasVideoError = true;
};
const pickWatermark = async () => {
    const p = await apiClient.selectWatermarkFile();
    if (p) {
        wmForm.value.path = p;
        const img = new Image();
        img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
                wmNaturalAspect.value = img.naturalWidth / img.naturalHeight;
            }
        };
        img.src = `/image?path=${encodeURIComponent(p)}`;
    }
};
const pickPip = async () => {
    const files = await apiClient.selectFiles();
    if (files && files.length > 0) {
        pipForm.value.path = files[0];
    }
};
const startListeners = () => {
    window.addEventListener("mousemove", onGlobalMouseMove);
    window.addEventListener("mouseup", onGlobalMouseUp);
    if (!clockTimer) {
        clockTimer = setInterval(() => {
            currentClock.value = new Date();
        }, 1000);
    }
};
const stopListeners = () => {
    window.removeEventListener("mousemove", onGlobalMouseMove);
    window.removeEventListener("mouseup", onGlobalMouseUp);
    if (clockTimer) {
        clearInterval(clockTimer);
        clockTimer = null;
    }
};
onMounted(() => {
    startListeners();
    const dims = getVideoDims();
    blurForm.value.x = Math.round(dims.w * 0.25);
    blurForm.value.y = Math.round(dims.h * 0.25);
    blurForm.value.w = Math.round(dims.w * 0.5) - (Math.round(dims.w * 0.5) % 2);
    blurForm.value.h = Math.round(dims.h * 0.5) - (Math.round(dims.h * 0.5) % 2);
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
const buildParams = (op) => {
    const p = {};
    if (configStore.config.output_dir)
        p.output_dir = configStore.config.output_dir;
    if (op === "add_watermark") {
        if (!wmForm.value.path) {
            message.error(t("msg_no_wm_file"));
            return null;
        }
        p.watermark_file = wmForm.value.path;
        p.opacity = wmForm.value.opacity;
        p.size = wmForm.value.size;
        p.position = wmForm.value.position;
        p.x_pct = wmForm.value.x_pct;
        p.y_pct = wmForm.value.y_pct;
    }
    else if (op === "add_text_overlay") {
        p.text = textForm.value.text;
        p.fontsize = textForm.value.fontsize;
        p.color = textForm.value.color;
        p.position = textForm.value.position;
        p.x_pct = textForm.value.x_pct;
        p.y_pct = textForm.value.y_pct;
        p.use_box = !!textForm.value.use_box;
    }
    else if (op === "add_timestamp") {
        p.format = tsForm.value.format;
        p.fontsize = tsForm.value.fontsize;
        p.color = tsForm.value.color;
        p.position = tsForm.value.position;
        p.x_pct = tsForm.value.x_pct;
        p.y_pct = tsForm.value.y_pct;
        p.use_box = !!tsForm.value.use_box;
    }
    else if (op === "blur_video") {
        p.effect = blurForm.value.effect;
        p.intensity = blurForm.value.intensity;
        p.x = blurForm.value.x;
        p.y = blurForm.value.y;
        p.w = blurForm.value.w;
        p.h = blurForm.value.h;
    }
    else if (op === "overlay") {
        if (!pipForm.value.path) {
            message.error(t("msg_no_pip_file"));
            return null;
        }
        p.pip_file = pipForm.value.path;
        p.scale = pipForm.value.scale;
        p.position = pipForm.value.position;
        p.x_pct = pipForm.value.x_pct;
        p.y_pct = pipForm.value.y_pct;
    }
    return p;
};
const runOp = async (op) => {
    if (!queueStore.activeFilePath) {
        message.warning(t("msg_select_first"));
        return;
    }
    const params = buildParams(op);
    if (!params)
        return;
    await apiClient.startOperation(op, queueStore.activeFilePath, params);
};
const runBatch = async (op) => {
    if (queueStore.fileQueue.length === 0) {
        message.warning(t("msg_queue_empty_batch"));
        return;
    }
    const params = buildParams(op);
    if (!params)
        return;
    const paths = queueStore.fileQueue.map((f) => f.path);
    await apiClient.startBatch(op, paths, params);
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "studio-subtabs" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subFx = 'watermark';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subFx === 'watermark' }) },
});
(__VLS_ctx.t('sub_fx_watermark'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subFx = 'text';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subFx === 'text' }) },
});
(__VLS_ctx.t('sub_fx_text'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subFx = 'timestamp';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subFx === 'timestamp' }) },
});
(__VLS_ctx.t('sub_fx_timestamp'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subFx = 'blur';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subFx === 'blur' }) },
});
(__VLS_ctx.t('sub_fx_blur'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subFx = 'pip';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subFx === 'pip' }) },
});
(__VLS_ctx.t('sub_fx_pip'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "interactive-stage-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stage-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "stage-title" },
});
(__VLS_ctx.t('fx_interactive_title'));
const __VLS_0 = {}.NTag;
/** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    size: "tiny",
    type: "success",
    round: true,
}));
const __VLS_2 = __VLS_1({
    size: "tiny",
    type: "success",
    round: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
__VLS_3.slots.default;
(__VLS_ctx.t('fx_interactive_tag'));
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
if (__VLS_ctx.subFx === 'watermark') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('fx_hint_wm'));
}
else if (__VLS_ctx.subFx === 'blur') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('fx_hint_blur'));
}
else if (__VLS_ctx.subFx === 'text') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('fx_hint_text'));
}
else if (__VLS_ctx.subFx === 'timestamp') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('fx_hint_ts'));
}
else if (__VLS_ctx.subFx === 'pip') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('fx_hint_pip'));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "stage-outer-wrapper" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onMousedown: (__VLS_ctx.onStageMouseDown) },
    ...{ class: "interactive-viewport" },
    ...{ style: (__VLS_ctx.viewportStyle) },
    ref: "stageRef",
});
/** @type {typeof __VLS_ctx.stageRef} */ ;
__VLS_asFunctionalElement(__VLS_intrinsicElements.video, __VLS_intrinsicElements.video)({
    ...{ onError: (__VLS_ctx.onVideoError) },
    id: "interactive-canvas-video",
    src: (__VLS_ctx.queueStore.activeVideoSrc),
    poster: (__VLS_ctx.queueStore.activeFrameSrc),
    ...{ class: "stage-video" },
    playsinline: true,
    muted: true,
    loop: true,
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.queueStore.activeVideoSrc && !__VLS_ctx.queueStore.hasVideoError) }, null, null);
if (__VLS_ctx.queueStore.activeFrameSrc && __VLS_ctx.queueStore.hasVideoError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.queueStore.activeFrameSrc),
        ...{ class: "stage-video" },
        ...{ style: {} },
    });
}
if (!__VLS_ctx.queueStore.activeVideoSrc) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stage-placeholder-grid" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        width: "100%",
        height: "100%",
        xmlns: "http://www.w3.org/2000/svg",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.defs, __VLS_intrinsicElements.defs)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.pattern, __VLS_intrinsicElements.pattern)({
        id: "grid",
        width: "40",
        height: "40",
        patternUnits: "userSpaceOnUse",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M 40 0 L 0 0 0 40",
        fill: "none",
        stroke: "rgba(255, 255, 255, 0.05)",
        'stroke-width': "1",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
        width: "100%",
        height: "100%",
        fill: "url(#grid)",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "placeholder-hint" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "18",
        height: "18",
        stroke: "currentColor",
        'stroke-width': "1.8",
        fill: "none",
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
        points: "5 3 19 12 5 21 5 3",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('fx_stage_placeholder'));
}
if (__VLS_ctx.subFx === 'watermark') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (__VLS_ctx.onStartDragWatermark) },
        ...{ class: "stage-overlay-item is-watermark" },
        ...{ style: (__VLS_ctx.wmBoxStyle) },
        title: (__VLS_ctx.t('drag_logo_tip')),
    });
    if (__VLS_ctx.activeWatermarkSrc) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            ...{ onLoad: (__VLS_ctx.onWatermarkImgLoad) },
            src: (__VLS_ctx.activeWatermarkSrc),
            ...{ class: "stage-wm-img" },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "stage-wm-dummy" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('logo_watermark_text'));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stage-item-badge" },
    });
    (__VLS_ctx.wmForm.x_pct);
    (__VLS_ctx.wmForm.y_pct);
}
if (__VLS_ctx.subFx === 'text') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (__VLS_ctx.onStartDragText) },
        ...{ class: "stage-overlay-item is-text" },
        ...{ style: ({
                left: __VLS_ctx.textForm.x_pct + '%',
                top: __VLS_ctx.textForm.y_pct + '%',
                transform: 'translate(-50%, -50%)',
                color: __VLS_ctx.textForm.color,
                fontSize: Math.max(12, Math.round(__VLS_ctx.textForm.fontsize / 2.2)) + 'px',
                background: __VLS_ctx.textForm.use_box ? 'rgba(0, 0, 0, 0.65)' : 'transparent',
                textShadow: __VLS_ctx.textForm.use_box ? 'none' : '0 0 3px #000, 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
                border: __VLS_ctx.textForm.use_box ? '1px solid rgba(255,255,255,0.2)' : '1.5px dashed var(--accent)',
                whiteSpace: 'nowrap',
                minWidth: 'max-content',
                padding: '4px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
            }) },
        title: (__VLS_ctx.t('drag_text_tip')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.textForm.text || __VLS_ctx.t('default_text_content'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stage-item-badge" },
    });
    (__VLS_ctx.textForm.x_pct);
    (__VLS_ctx.textForm.y_pct);
}
if (__VLS_ctx.subFx === 'timestamp') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (__VLS_ctx.onStartDragTimestamp) },
        ...{ class: "stage-overlay-item is-text" },
        ...{ style: ({
                left: __VLS_ctx.tsForm.x_pct + '%',
                top: __VLS_ctx.tsForm.y_pct + '%',
                transform: 'translate(-50%, -50%)',
                color: __VLS_ctx.tsForm.color,
                fontSize: Math.max(11, Math.round(__VLS_ctx.tsForm.fontsize / 2.2)) + 'px',
                background: __VLS_ctx.tsForm.use_box ? 'rgba(0, 0, 0, 0.65)' : 'transparent',
                textShadow: __VLS_ctx.tsForm.use_box ? 'none' : '0 0 3px #000, 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
                border: __VLS_ctx.tsForm.use_box ? '1px solid rgba(255,255,255,0.2)' : '1.5px dashed var(--accent)',
                whiteSpace: 'nowrap',
                minWidth: 'max-content',
                padding: '4px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
            }) },
        title: (__VLS_ctx.t('drag_timecode_tip')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.liveFormattedTimestamp || '2026-10-17 00:00:00');
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stage-item-badge" },
    });
    (__VLS_ctx.tsForm.x_pct);
    (__VLS_ctx.tsForm.y_pct);
}
if (__VLS_ctx.subFx === 'blur') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (__VLS_ctx.onStartMoveBlur) },
        ...{ class: "stage-overlay-item is-blur" },
        ...{ style: (__VLS_ctx.blurBoxStyle) },
        title: (__VLS_ctx.t('drag_blur_tip')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stage-blur-badge" },
        ...{ style: ({ color: __VLS_ctx.blurForm.effect === 'pixelate' ? '#f59e0b' : '#38bdf8', borderColor: __VLS_ctx.blurForm.effect === 'pixelate' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)' }) },
    });
    (__VLS_ctx.blurForm.effect === 'pixelate' ? __VLS_ctx.t('pixelate_prefix') + ' ' + Math.max(4, Math.round(__VLS_ctx.blurForm.intensity / 4)) + 'px' : __VLS_ctx.t('blur_prefix') + ' R=' + Math.max(2, Math.round(__VLS_ctx.blurForm.intensity / 3.5)) + 'px');
    (__VLS_ctx.blurForm.w);
    (__VLS_ctx.blurForm.h);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (__VLS_ctx.onStartResizeBlur) },
        ...{ class: "handle-br" },
    });
}
if (__VLS_ctx.subFx === 'pip') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (__VLS_ctx.onStartDragPip) },
        ...{ class: "stage-overlay-item is-pip" },
        ...{ style: ({
                left: __VLS_ctx.pipForm.x_pct + '%',
                top: __VLS_ctx.pipForm.y_pct + '%',
                width: __VLS_ctx.pipForm.scale + '%',
                transform: 'translate(-50%, -50%)'
            }) },
        title: (__VLS_ctx.t('drag_pip_tip')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "pip-inner" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('pip_overlay_label'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stage-item-badge" },
    });
    (__VLS_ctx.pipForm.scale);
    (__VLS_ctx.pipForm.x_pct);
    (__VLS_ctx.pipForm.y_pct);
}
if (__VLS_ctx.queueStore.activeVideoSrc) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stage-video-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.toggleStagePlayback) },
        ...{ class: "stage-play-btn" },
        title: (__VLS_ctx.t('play_pause_tooltip')),
    });
    if (!__VLS_ctx.isStagePlaying) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "12",
            height: "12",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
            points: "5 3 19 12 5 21 5 3",
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "12",
            height: "12",
            fill: "currentColor",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
            x: "6",
            y: "4",
            width: "4",
            height: "16",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
            x: "14",
            y: "4",
            width: "4",
            height: "16",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "stage-timecode" },
    });
    (__VLS_ctx.t('preview_badge'));
}
if (__VLS_ctx.subFx === 'watermark') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('wm_params_title'));
    if (__VLS_ctx.wmForm.position === 'custom') {
        const __VLS_4 = {}.NTag;
        /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
        // @ts-ignore
        const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
            size: "small",
            type: "primary",
            round: true,
        }));
        const __VLS_6 = __VLS_5({
            size: "small",
            type: "primary",
            round: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_5));
        __VLS_7.slots.default;
        (__VLS_ctx.t('position_coord'));
        (__VLS_ctx.wmForm.x_pct);
        (__VLS_ctx.wmForm.y_pct);
        var __VLS_7;
    }
    else {
        const __VLS_8 = {}.NTag;
        /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
            size: "small",
            type: "info",
            round: true,
        }));
        const __VLS_10 = __VLS_9({
            size: "small",
            type: "info",
            round: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        __VLS_11.slots.default;
        (__VLS_ctx.t('preset_label'));
        (__VLS_ctx.wmForm.position);
        var __VLS_11;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('wm_file_label'));
    const __VLS_12 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        align: "center",
        size: (8),
    }));
    const __VLS_14 = __VLS_13({
        align: "center",
        size: (8),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    const __VLS_16 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        value: (__VLS_ctx.wmForm.path),
        placeholder: (__VLS_ctx.t('choose_file')),
        ...{ style: {} },
    }));
    const __VLS_18 = __VLS_17({
        value: (__VLS_ctx.wmForm.path),
        placeholder: (__VLS_ctx.t('choose_file')),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    const __VLS_20 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_24;
    let __VLS_25;
    let __VLS_26;
    const __VLS_27 = {
        onClick: (__VLS_ctx.pickWatermark)
    };
    __VLS_23.slots.default;
    (__VLS_ctx.t('browse'));
    var __VLS_23;
    var __VLS_15;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-grid-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('opacity_label'));
    (__VLS_ctx.wmForm.opacity);
    const __VLS_28 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        value: (__VLS_ctx.wmForm.opacity),
        min: (10),
        max: (100),
    }));
    const __VLS_30 = __VLS_29({
        value: (__VLS_ctx.wmForm.opacity),
        min: (10),
        max: (100),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('logo_size_label'));
    (__VLS_ctx.wmForm.size);
    const __VLS_32 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        value: (__VLS_ctx.wmForm.size),
        min: (5),
        max: (80),
    }));
    const __VLS_34 = __VLS_33({
        value: (__VLS_ctx.wmForm.size),
        min: (5),
        max: (80),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('quick_presets_corner'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid-3x3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'watermark'))
                    return;
                __VLS_ctx.setWmPreset('top-left');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.wmForm.position === 'top-left' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'watermark'))
                    return;
                __VLS_ctx.setWmPreset('top-center');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.wmForm.position === 'top-center' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'watermark'))
                    return;
                __VLS_ctx.setWmPreset('top-right');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.wmForm.position === 'top-right' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'watermark'))
                    return;
                __VLS_ctx.setWmPreset('center-left');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.wmForm.position === 'center-left' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'watermark'))
                    return;
                __VLS_ctx.setWmPreset('center');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.wmForm.position === 'center' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'watermark'))
                    return;
                __VLS_ctx.setWmPreset('center-right');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.wmForm.position === 'center-right' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'watermark'))
                    return;
                __VLS_ctx.setWmPreset('bottom-left');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.wmForm.position === 'bottom-left' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'watermark'))
                    return;
                __VLS_ctx.setWmPreset('bottom-center');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.wmForm.position === 'bottom-center' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'watermark'))
                    return;
                __VLS_ctx.setWmPreset('bottom-right');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.wmForm.position === 'bottom-right' }) },
    });
    const __VLS_36 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        size: (10),
    }));
    const __VLS_38 = __VLS_37({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    __VLS_39.slots.default;
    const __VLS_40 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_42 = __VLS_41({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    let __VLS_44;
    let __VLS_45;
    let __VLS_46;
    const __VLS_47 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'watermark'))
                return;
            __VLS_ctx.runOp('add_watermark');
        }
    };
    __VLS_43.slots.default;
    (__VLS_ctx.t('btn_wm_file'));
    var __VLS_43;
    const __VLS_48 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_50 = __VLS_49({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    let __VLS_52;
    let __VLS_53;
    let __VLS_54;
    const __VLS_55 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'watermark'))
                return;
            __VLS_ctx.runBatch('add_watermark');
        }
    };
    __VLS_51.slots.default;
    (__VLS_ctx.t('btn_speed_queue'));
    var __VLS_51;
    var __VLS_39;
}
if (__VLS_ctx.subFx === 'text') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('text_params_title'));
    if (__VLS_ctx.textForm.position === 'custom') {
        const __VLS_56 = {}.NTag;
        /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
        // @ts-ignore
        const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
            size: "small",
            type: "primary",
            round: true,
        }));
        const __VLS_58 = __VLS_57({
            size: "small",
            type: "primary",
            round: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_57));
        __VLS_59.slots.default;
        (__VLS_ctx.t('position_coord'));
        (__VLS_ctx.textForm.x_pct);
        (__VLS_ctx.textForm.y_pct);
        var __VLS_59;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('text_content_label'));
    const __VLS_60 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        value: (__VLS_ctx.textForm.text),
        placeholder: (__VLS_ctx.t('text_placeholder')),
    }));
    const __VLS_62 = __VLS_61({
        value: (__VLS_ctx.textForm.text),
        placeholder: (__VLS_ctx.t('text_placeholder')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-grid-2" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('font_size_label'));
    (__VLS_ctx.textForm.fontsize);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_64 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        value: (__VLS_ctx.textForm.fontsize),
        min: (12),
        max: (140),
        step: (1),
        ...{ style: {} },
    }));
    const __VLS_66 = __VLS_65({
        value: (__VLS_ctx.textForm.fontsize),
        min: (12),
        max: (140),
        step: (1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    const __VLS_68 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        value: (__VLS_ctx.textForm.fontsize),
        min: (12),
        max: (200),
        ...{ style: {} },
    }));
    const __VLS_70 = __VLS_69({
        value: (__VLS_ctx.textForm.fontsize),
        min: (12),
        max: (200),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('text_color_label'));
    const __VLS_72 = {}.NColorPicker;
    /** @type {[typeof __VLS_components.NColorPicker, typeof __VLS_components.nColorPicker, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        value: (__VLS_ctx.textForm.color),
        showAlpha: (false),
        ...{ style: {} },
    }));
    const __VLS_74 = __VLS_73({
        value: (__VLS_ctx.textForm.color),
        showAlpha: (false),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    for (const [c] of __VLS_getVForSourceType((__VLS_ctx.colorPresets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.subFx === 'text'))
                        return;
                    __VLS_ctx.textForm.color = c;
                } },
            key: (c),
            ...{ style: ({
                    background: c,
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: __VLS_ctx.textForm.color === c ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.25)',
                    boxSizing: 'border-box'
                }) },
            title: (c),
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('box_bg_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('box_bg_desc_text'));
    const __VLS_76 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, typeof __VLS_components.nSwitch, typeof __VLS_components.NSwitch, typeof __VLS_components.nSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        value: (__VLS_ctx.textForm.use_box),
        size: "small",
    }));
    const __VLS_78 = __VLS_77({
        value: (__VLS_ctx.textForm.use_box),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    __VLS_79.slots.default;
    {
        const { checked: __VLS_thisSlot } = __VLS_79.slots;
        (__VLS_ctx.t('sw_on'));
    }
    {
        const { unchecked: __VLS_thisSlot } = __VLS_79.slots;
        (__VLS_ctx.t('sw_off'));
    }
    var __VLS_79;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('quick_presets_corner'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "grid-3x3" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'text'))
                    return;
                __VLS_ctx.setTextPreset('top-left');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.textForm.position === 'top-left' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'text'))
                    return;
                __VLS_ctx.setTextPreset('top-center');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.textForm.position === 'top-center' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'text'))
                    return;
                __VLS_ctx.setTextPreset('top-right');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.textForm.position === 'top-right' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'text'))
                    return;
                __VLS_ctx.setTextPreset('center-left');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.textForm.position === 'center-left' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'text'))
                    return;
                __VLS_ctx.setTextPreset('center');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.textForm.position === 'center' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'text'))
                    return;
                __VLS_ctx.setTextPreset('center-right');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.textForm.position === 'center-right' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'text'))
                    return;
                __VLS_ctx.setTextPreset('bottom-left');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.textForm.position === 'bottom-left' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'text'))
                    return;
                __VLS_ctx.setTextPreset('bottom-center');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.textForm.position === 'bottom-center' }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.subFx === 'text'))
                    return;
                __VLS_ctx.setTextPreset('bottom-right');
            } },
        ...{ class: "grid-cell" },
        ...{ class: ({ 'is-selected': __VLS_ctx.textForm.position === 'bottom-right' }) },
    });
    const __VLS_80 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        size: (10),
    }));
    const __VLS_82 = __VLS_81({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    __VLS_83.slots.default;
    const __VLS_84 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_86 = __VLS_85({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    let __VLS_88;
    let __VLS_89;
    let __VLS_90;
    const __VLS_91 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'text'))
                return;
            __VLS_ctx.runOp('add_text_overlay');
        }
    };
    __VLS_87.slots.default;
    (__VLS_ctx.t('btn_text_file'));
    var __VLS_87;
    const __VLS_92 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_94 = __VLS_93({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    let __VLS_96;
    let __VLS_97;
    let __VLS_98;
    const __VLS_99 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'text'))
                return;
            __VLS_ctx.runBatch('add_text_overlay');
        }
    };
    __VLS_95.slots.default;
    (__VLS_ctx.t('btn_speed_queue'));
    var __VLS_95;
    var __VLS_83;
}
if (__VLS_ctx.subFx === 'timestamp') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('ts_title'));
    const __VLS_100 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        size: "small",
        type: "success",
        round: true,
    }));
    const __VLS_102 = __VLS_101({
        size: "small",
        type: "success",
        round: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    __VLS_103.slots.default;
    (__VLS_ctx.liveFormattedTimestamp);
    var __VLS_103;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-grid-2" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('ts_format_label'));
    const __VLS_104 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        value: (__VLS_ctx.tsForm.format),
        placeholder: "%Y-%m-%d %H:%M:%S",
    }));
    const __VLS_106 = __VLS_105({
        value: (__VLS_ctx.tsForm.format),
        placeholder: "%Y-%m-%d %H:%M:%S",
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('font_size_label'));
    (__VLS_ctx.tsForm.fontsize);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_108 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        value: (__VLS_ctx.tsForm.fontsize),
        min: (10),
        max: (120),
        step: (1),
        ...{ style: {} },
    }));
    const __VLS_110 = __VLS_109({
        value: (__VLS_ctx.tsForm.fontsize),
        min: (10),
        max: (120),
        step: (1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    const __VLS_112 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        value: (__VLS_ctx.tsForm.fontsize),
        min: (10),
        max: (160),
        ...{ style: {} },
    }));
    const __VLS_114 = __VLS_113({
        value: (__VLS_ctx.tsForm.fontsize),
        min: (10),
        max: (160),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('ts_color_label'));
    const __VLS_116 = {}.NColorPicker;
    /** @type {[typeof __VLS_components.NColorPicker, typeof __VLS_components.nColorPicker, ]} */ ;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
        value: (__VLS_ctx.tsForm.color),
        showAlpha: (false),
        ...{ style: {} },
    }));
    const __VLS_118 = __VLS_117({
        value: (__VLS_ctx.tsForm.color),
        showAlpha: (false),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    for (const [c] of __VLS_getVForSourceType((__VLS_ctx.colorPresets))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.subFx === 'timestamp'))
                        return;
                    __VLS_ctx.tsForm.color = c;
                } },
            key: (c),
            ...{ style: ({
                    background: c,
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    border: __VLS_ctx.tsForm.color === c ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.25)',
                    boxSizing: 'border-box'
                }) },
            title: (c),
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('box_bg_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('box_bg_desc_ts'));
    const __VLS_120 = {}.NSwitch;
    /** @type {[typeof __VLS_components.NSwitch, typeof __VLS_components.nSwitch, typeof __VLS_components.NSwitch, typeof __VLS_components.nSwitch, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        value: (__VLS_ctx.tsForm.use_box),
        size: "small",
    }));
    const __VLS_122 = __VLS_121({
        value: (__VLS_ctx.tsForm.use_box),
        size: "small",
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    __VLS_123.slots.default;
    {
        const { checked: __VLS_thisSlot } = __VLS_123.slots;
        (__VLS_ctx.t('sw_on'));
    }
    {
        const { unchecked: __VLS_thisSlot } = __VLS_123.slots;
        (__VLS_ctx.t('sw_off'));
    }
    var __VLS_123;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('ts_presets_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_124 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_126 = __VLS_125({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    let __VLS_128;
    let __VLS_129;
    let __VLS_130;
    const __VLS_131 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'timestamp'))
                return;
            __VLS_ctx.tsForm.format = '%Y-%m-%d %H:%M:%S';
        }
    };
    __VLS_127.slots.default;
    (__VLS_ctx.t('ts_p_datetime_iso'));
    var __VLS_127;
    const __VLS_132 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_134 = __VLS_133({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    let __VLS_136;
    let __VLS_137;
    let __VLS_138;
    const __VLS_139 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'timestamp'))
                return;
            __VLS_ctx.tsForm.format = '%d.%m.%Y %H:%M:%S';
        }
    };
    __VLS_135.slots.default;
    (__VLS_ctx.t('ts_p_datetime_eur'));
    var __VLS_135;
    const __VLS_140 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_142 = __VLS_141({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_141));
    let __VLS_144;
    let __VLS_145;
    let __VLS_146;
    const __VLS_147 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'timestamp'))
                return;
            __VLS_ctx.tsForm.format = '%H:%M:%S';
        }
    };
    __VLS_143.slots.default;
    (__VLS_ctx.t('ts_p_time'));
    var __VLS_143;
    const __VLS_148 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_150 = __VLS_149({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_149));
    let __VLS_152;
    let __VLS_153;
    let __VLS_154;
    const __VLS_155 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'timestamp'))
                return;
            __VLS_ctx.tsForm.format = '%d.%m.%Y';
        }
    };
    __VLS_151.slots.default;
    (__VLS_ctx.t('ts_p_date'));
    var __VLS_151;
    const __VLS_156 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_158 = __VLS_157({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_157));
    let __VLS_160;
    let __VLS_161;
    let __VLS_162;
    const __VLS_163 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'timestamp'))
                return;
            __VLS_ctx.tsForm.format = '%{pts:hms}';
        }
    };
    __VLS_159.slots.default;
    (__VLS_ctx.t('ts_p_vid'));
    var __VLS_159;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('live_ts_preview'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({
        ...{ style: {} },
    });
    (__VLS_ctx.liveFormattedTimestamp || '2026-10-17 00:00:00');
    const __VLS_164 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
        size: (10),
    }));
    const __VLS_166 = __VLS_165({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_165));
    __VLS_167.slots.default;
    const __VLS_168 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_170 = __VLS_169({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_169));
    let __VLS_172;
    let __VLS_173;
    let __VLS_174;
    const __VLS_175 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'timestamp'))
                return;
            __VLS_ctx.runOp('add_timestamp');
        }
    };
    __VLS_171.slots.default;
    (__VLS_ctx.t('btn_ts_file'));
    var __VLS_171;
    const __VLS_176 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_177 = __VLS_asFunctionalComponent(__VLS_176, new __VLS_176({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_178 = __VLS_177({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_177));
    let __VLS_180;
    let __VLS_181;
    let __VLS_182;
    const __VLS_183 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'timestamp'))
                return;
            __VLS_ctx.runBatch('add_timestamp');
        }
    };
    __VLS_179.slots.default;
    (__VLS_ctx.t('btn_speed_queue'));
    var __VLS_179;
    var __VLS_167;
}
if (__VLS_ctx.subFx === 'blur') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('blur_title'));
    const __VLS_184 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
        size: "small",
        type: "info",
        round: true,
    }));
    const __VLS_186 = __VLS_185({
        size: "small",
        type: "info",
        round: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_185));
    __VLS_187.slots.default;
    (__VLS_ctx.t('selected_zone'));
    (__VLS_ctx.blurForm.w);
    (__VLS_ctx.blurForm.h);
    (__VLS_ctx.blurForm.x);
    (__VLS_ctx.blurForm.y);
    var __VLS_187;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_188 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.blurForm.effect !== 'blur'),
        type: (__VLS_ctx.blurForm.effect === 'blur' ? 'primary' : 'default'),
    }));
    const __VLS_190 = __VLS_189({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.blurForm.effect !== 'blur'),
        type: (__VLS_ctx.blurForm.effect === 'blur' ? 'primary' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_189));
    let __VLS_192;
    let __VLS_193;
    let __VLS_194;
    const __VLS_195 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'blur'))
                return;
            __VLS_ctx.blurForm.effect = 'blur';
        }
    };
    __VLS_191.slots.default;
    (__VLS_ctx.t('blur_box'));
    var __VLS_191;
    const __VLS_196 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.blurForm.effect !== 'pixelate'),
        type: (__VLS_ctx.blurForm.effect === 'pixelate' ? 'primary' : 'default'),
    }));
    const __VLS_198 = __VLS_197({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.blurForm.effect !== 'pixelate'),
        type: (__VLS_ctx.blurForm.effect === 'pixelate' ? 'primary' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_197));
    let __VLS_200;
    let __VLS_201;
    let __VLS_202;
    const __VLS_203 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'blur'))
                return;
            __VLS_ctx.blurForm.effect = 'pixelate';
        }
    };
    __VLS_199.slots.default;
    (__VLS_ctx.t('blur_pixelate'));
    var __VLS_199;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-grid-2" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('zone_x'));
    (__VLS_ctx.blurForm.x);
    const __VLS_204 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
        value: (__VLS_ctx.blurForm.x),
        min: (0),
        ...{ style: {} },
    }));
    const __VLS_206 = __VLS_205({
        value: (__VLS_ctx.blurForm.x),
        min: (0),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_205));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('zone_y'));
    (__VLS_ctx.blurForm.y);
    const __VLS_208 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
        value: (__VLS_ctx.blurForm.y),
        min: (0),
        ...{ style: {} },
    }));
    const __VLS_210 = __VLS_209({
        value: (__VLS_ctx.blurForm.y),
        min: (0),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_209));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('zone_w'));
    (__VLS_ctx.blurForm.w);
    const __VLS_212 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
        value: (__VLS_ctx.blurForm.w),
        min: (16),
        ...{ style: {} },
    }));
    const __VLS_214 = __VLS_213({
        value: (__VLS_ctx.blurForm.w),
        min: (16),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_213));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('zone_h'));
    (__VLS_ctx.blurForm.h);
    const __VLS_216 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({
        value: (__VLS_ctx.blurForm.h),
        min: (16),
        ...{ style: {} },
    }));
    const __VLS_218 = __VLS_217({
        value: (__VLS_ctx.blurForm.h),
        min: (16),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_217));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('zone_intensity'));
    (__VLS_ctx.blurForm.intensity);
    const __VLS_220 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
        value: (__VLS_ctx.blurForm.intensity),
        min: (10),
        max: (100),
    }));
    const __VLS_222 = __VLS_221({
        value: (__VLS_ctx.blurForm.intensity),
        min: (10),
        max: (100),
    }, ...__VLS_functionalComponentArgsRest(__VLS_221));
    const __VLS_224 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_225 = __VLS_asFunctionalComponent(__VLS_224, new __VLS_224({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_226 = __VLS_225({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_225));
    let __VLS_228;
    let __VLS_229;
    let __VLS_230;
    const __VLS_231 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'blur'))
                return;
            __VLS_ctx.runOp('blur_video');
        }
    };
    __VLS_227.slots.default;
    (__VLS_ctx.t('btn_blur_file'));
    var __VLS_227;
}
if (__VLS_ctx.subFx === 'pip') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('pip_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('pip_file_label'));
    const __VLS_232 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_233 = __VLS_asFunctionalComponent(__VLS_232, new __VLS_232({
        align: "center",
        size: (8),
    }));
    const __VLS_234 = __VLS_233({
        align: "center",
        size: (8),
    }, ...__VLS_functionalComponentArgsRest(__VLS_233));
    __VLS_235.slots.default;
    const __VLS_236 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_237 = __VLS_asFunctionalComponent(__VLS_236, new __VLS_236({
        value: (__VLS_ctx.pipForm.path),
        placeholder: (__VLS_ctx.t('pip_file_placeholder')),
        ...{ style: {} },
    }));
    const __VLS_238 = __VLS_237({
        value: (__VLS_ctx.pipForm.path),
        placeholder: (__VLS_ctx.t('pip_file_placeholder')),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_237));
    const __VLS_240 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_241 = __VLS_asFunctionalComponent(__VLS_240, new __VLS_240({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_242 = __VLS_241({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_241));
    let __VLS_244;
    let __VLS_245;
    let __VLS_246;
    const __VLS_247 = {
        onClick: (__VLS_ctx.pickPip)
    };
    __VLS_243.slots.default;
    (__VLS_ctx.t('browse'));
    var __VLS_243;
    var __VLS_235;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('pip_scale_label'));
    (__VLS_ctx.pipForm.scale);
    const __VLS_248 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_249 = __VLS_asFunctionalComponent(__VLS_248, new __VLS_248({
        value: (__VLS_ctx.pipForm.scale),
        min: (10),
        max: (80),
    }));
    const __VLS_250 = __VLS_249({
        value: (__VLS_ctx.pipForm.scale),
        min: (10),
        max: (80),
    }, ...__VLS_functionalComponentArgsRest(__VLS_249));
    const __VLS_252 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_253 = __VLS_asFunctionalComponent(__VLS_252, new __VLS_252({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_254 = __VLS_253({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_253));
    let __VLS_256;
    let __VLS_257;
    let __VLS_258;
    const __VLS_259 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subFx === 'pip'))
                return;
            __VLS_ctx.runOp('overlay');
        }
    };
    __VLS_255.slots.default;
    (__VLS_ctx.t('btn_pip_file'));
    var __VLS_255;
}
/** @type {__VLS_StyleScopedClasses['studio-subtabs']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['interactive-stage-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-header']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-title']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-outer-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['interactive-viewport']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-video']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-video']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-placeholder-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-overlay-item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-watermark']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-wm-img']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-wm-dummy']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-item-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-overlay-item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-text']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-item-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-overlay-item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-text']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-item-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-overlay-item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-blur']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-blur-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['handle-br']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-overlay-item']} */ ;
/** @type {__VLS_StyleScopedClasses['is-pip']} */ ;
/** @type {__VLS_StyleScopedClasses['pip-inner']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-item-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-video-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-play-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-timecode']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-3x3']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-3x3']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['grid-cell']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NSlider: NSlider,
            NInput: NInput,
            NInputNumber: NInputNumber,
            NTag: NTag,
            NFlex: NFlex,
            NSwitch: NSwitch,
            NColorPicker: NColorPicker,
            t: t,
            queueStore: queueStore,
            subFx: subFx,
            colorPresets: colorPresets,
            liveFormattedTimestamp: liveFormattedTimestamp,
            wmForm: wmForm,
            textForm: textForm,
            tsForm: tsForm,
            blurForm: blurForm,
            pipForm: pipForm,
            stageRef: stageRef,
            isStagePlaying: isStagePlaying,
            activeWatermarkSrc: activeWatermarkSrc,
            viewportStyle: viewportStyle,
            wmBoxStyle: wmBoxStyle,
            blurBoxStyle: blurBoxStyle,
            onWatermarkImgLoad: onWatermarkImgLoad,
            setWmPreset: setWmPreset,
            setTextPreset: setTextPreset,
            onStageMouseDown: onStageMouseDown,
            onStartDragWatermark: onStartDragWatermark,
            onStartDragText: onStartDragText,
            onStartDragTimestamp: onStartDragTimestamp,
            onStartDragPip: onStartDragPip,
            onStartMoveBlur: onStartMoveBlur,
            onStartResizeBlur: onStartResizeBlur,
            toggleStagePlayback: toggleStagePlayback,
            onVideoError: onVideoError,
            pickWatermark: pickWatermark,
            pickPip: pickPip,
            runOp: runOp,
            runBatch: runBatch,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=EffectsView.vue.js.map
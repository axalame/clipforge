import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NSlider, NInputNumber, NTag, NFlex, useMessage, } from "naive-ui";
import { useQueueStore } from "@/stores/queue";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";
const { t } = useI18n();
const message = useMessage();
const queueStore = useQueueStore();
const configStore = useConfigStore();
const subGeom = ref("crop");
const stageRef = ref(null);
const stageMode = ref("");
const dragStart = ref({ x: 0, y: 0, mouseX: 0, mouseY: 0, initX: 0, initY: 0, initW: 0, initH: 0 });
const isStagePlaying = ref(false);
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
const onStageMouseDown = (e) => {
    if (!stageRef.value)
        return;
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
const onStartMoveCrop = (e) => {
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
const onStartResizeCrop = (e) => {
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
const onGlobalMouseMove = (e) => {
    if (!stageMode.value || !stageRef.value)
        return;
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
    }
    else if (stageMode.value === "move_crop") {
        const dx = ((e.clientX - dragStart.value.mouseX) / rect.width) * vW;
        const dy = ((e.clientY - dragStart.value.mouseY) / rect.height) * vH;
        let nx = Math.round(dragStart.value.initX + dx);
        let ny = Math.round(dragStart.value.initY + dy);
        nx = Math.max(0, Math.min(vW - cropForm.value.width, nx));
        ny = Math.max(0, Math.min(vH - cropForm.value.height, ny));
        cropForm.value.x = nx;
        cropForm.value.y = ny;
        cropForm.value.use_exact = true;
    }
    else if (stageMode.value === "resize_crop") {
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
    const v = document.getElementById("interactive-crop-video");
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
const runOp = async (op) => {
    if (!queueStore.activeFilePath) {
        message.warning(t("msg_select_first"));
        return;
    }
    const params = {};
    if (configStore.config.output_dir)
        params.output_dir = configStore.config.output_dir;
    if (op === "crop") {
        params.width = cropForm.value.width;
        params.height = cropForm.value.height;
        params.x = cropForm.value.x;
        params.y = cropForm.value.y;
    }
    else if (op === "resize") {
        params.width = resizeForm.value.width;
        params.height = resizeForm.value.height;
        params.keep_aspect = resizeForm.value.keep_aspect;
    }
    else if (op === "rotate") {
        params.angle = rotateForm.value.angle;
    }
    else if (op === "change_fps") {
        params.fps = fpsForm.value.fps;
    }
    await apiClient.startOperation(op, queueStore.activeFilePath, params);
};
const runBatch = async (op) => {
    if (queueStore.fileQueue.length === 0) {
        message.warning(t("msg_queue_empty_batch"));
        return;
    }
    const params = {};
    if (configStore.config.output_dir)
        params.output_dir = configStore.config.output_dir;
    if (op === "crop") {
        params.width = cropForm.value.width;
        params.height = cropForm.value.height;
        params.x = cropForm.value.x;
        params.y = cropForm.value.y;
    }
    else if (op === "resize") {
        params.width = resizeForm.value.width;
        params.height = resizeForm.value.height;
        params.keep_aspect = resizeForm.value.keep_aspect;
    }
    else if (op === "rotate") {
        params.angle = rotateForm.value.angle;
    }
    else if (op === "change_fps") {
        params.fps = fpsForm.value.fps;
    }
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
            __VLS_ctx.subGeom = 'crop';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subGeom === 'crop' }) },
});
(__VLS_ctx.t('sub_geom_crop'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subGeom = 'resize';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subGeom === 'resize' }) },
});
(__VLS_ctx.t('sub_geom_resize'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subGeom = 'rotate';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subGeom === 'rotate' }) },
});
(__VLS_ctx.t('sub_geom_rotate'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subGeom = 'fps';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subGeom === 'fps' }) },
});
(__VLS_ctx.t('sub_geom_fps'));
if (__VLS_ctx.subGeom === 'crop') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
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
    (__VLS_ctx.t('crop_interactive_title'));
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
    (__VLS_ctx.t('realtime_selection'));
    var __VLS_3;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('crop_hint'));
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
        id: "interactive-crop-video",
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
            id: "cropgrid",
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
            fill: "url(#cropgrid)",
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
        (__VLS_ctx.t('crop_canvas_placeholder'));
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (__VLS_ctx.onStartMoveCrop) },
        ...{ class: "stage-overlay-item is-crop" },
        ...{ style: (__VLS_ctx.cropBoxStyle) },
        title: (__VLS_ctx.t('crop_box_tooltip')),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "crop-rule-of-thirds" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "stage-crop-badge" },
    });
    (__VLS_ctx.t('crop_frame_tag'));
    (__VLS_ctx.cropForm.width);
    (__VLS_ctx.cropForm.height);
    (__VLS_ctx.cropForm.x);
    (__VLS_ctx.cropForm.y);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onMousedown: (__VLS_ctx.onStartResizeCrop) },
        ...{ class: "handle-br is-crop-handle" },
    });
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
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('crop_params_title'));
    const __VLS_4 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        size: "small",
        type: "success",
        round: true,
    }));
    const __VLS_6 = __VLS_5({
        size: "small",
        type: "success",
        round: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_7.slots.default;
    (__VLS_ctx.cropForm.width);
    (__VLS_ctx.cropForm.height);
    (__VLS_ctx.cropForm.x);
    (__VLS_ctx.cropForm.y);
    var __VLS_7;
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
    (__VLS_ctx.t('offset_x'));
    const __VLS_8 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        value: (__VLS_ctx.cropForm.x),
        min: (0),
        ...{ style: {} },
    }));
    const __VLS_10 = __VLS_9({
        value: (__VLS_ctx.cropForm.x),
        min: (0),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('offset_y'));
    const __VLS_12 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        value: (__VLS_ctx.cropForm.y),
        min: (0),
        ...{ style: {} },
    }));
    const __VLS_14 = __VLS_13({
        value: (__VLS_ctx.cropForm.y),
        min: (0),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('frame_width'));
    const __VLS_16 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        value: (__VLS_ctx.cropForm.width),
        min: (32),
        ...{ style: {} },
    }));
    const __VLS_18 = __VLS_17({
        value: (__VLS_ctx.cropForm.width),
        min: (32),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('frame_height'));
    const __VLS_20 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        value: (__VLS_ctx.cropForm.height),
        min: (32),
        ...{ style: {} },
    }));
    const __VLS_22 = __VLS_21({
        value: (__VLS_ctx.cropForm.height),
        min: (32),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    const __VLS_24 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        size: (10),
    }));
    const __VLS_26 = __VLS_25({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    __VLS_27.slots.default;
    const __VLS_28 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_30 = __VLS_29({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    let __VLS_32;
    let __VLS_33;
    let __VLS_34;
    const __VLS_35 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'crop'))
                return;
            __VLS_ctx.runOp('crop');
        }
    };
    __VLS_31.slots.default;
    (__VLS_ctx.t('btn_crop_file'));
    var __VLS_31;
    const __VLS_36 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_38 = __VLS_37({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    let __VLS_40;
    let __VLS_41;
    let __VLS_42;
    const __VLS_43 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'crop'))
                return;
            __VLS_ctx.runBatch('crop');
        }
    };
    __VLS_39.slots.default;
    (__VLS_ctx.t('btn_crop_queue'));
    var __VLS_39;
    var __VLS_27;
}
if (__VLS_ctx.subGeom === 'resize') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('resize_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_44 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_46 = __VLS_45({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    let __VLS_48;
    let __VLS_49;
    let __VLS_50;
    const __VLS_51 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'resize'))
                return;
            __VLS_ctx.resizeForm.width = 1920;
            __VLS_ctx.resizeForm.height = 1080;
        }
    };
    __VLS_47.slots.default;
    var __VLS_47;
    const __VLS_52 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_54 = __VLS_53({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    let __VLS_56;
    let __VLS_57;
    let __VLS_58;
    const __VLS_59 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'resize'))
                return;
            __VLS_ctx.resizeForm.width = 1280;
            __VLS_ctx.resizeForm.height = 720;
        }
    };
    __VLS_55.slots.default;
    var __VLS_55;
    const __VLS_60 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_62 = __VLS_61({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    let __VLS_64;
    let __VLS_65;
    let __VLS_66;
    const __VLS_67 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'resize'))
                return;
            __VLS_ctx.resizeForm.width = 854;
            __VLS_ctx.resizeForm.height = 480;
        }
    };
    __VLS_63.slots.default;
    var __VLS_63;
    const __VLS_68 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_70 = __VLS_69({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    let __VLS_72;
    let __VLS_73;
    let __VLS_74;
    const __VLS_75 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'resize'))
                return;
            __VLS_ctx.resizeForm.width = 1080;
            __VLS_ctx.resizeForm.height = 1920;
        }
    };
    __VLS_71.slots.default;
    (__VLS_ctx.t('preset_vertical'));
    var __VLS_71;
    const __VLS_76 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_78 = __VLS_77({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    let __VLS_80;
    let __VLS_81;
    let __VLS_82;
    const __VLS_83 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'resize'))
                return;
            __VLS_ctx.resizeForm.width = 1080;
            __VLS_ctx.resizeForm.height = 1080;
        }
    };
    __VLS_79.slots.default;
    (__VLS_ctx.t('preset_square'));
    var __VLS_79;
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
    (__VLS_ctx.t('width_label'));
    (__VLS_ctx.resizeForm.width);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_84 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        value: (__VLS_ctx.resizeForm.width),
        min: (240),
        max: (3840),
        step: (2),
        ...{ style: {} },
    }));
    const __VLS_86 = __VLS_85({
        value: (__VLS_ctx.resizeForm.width),
        min: (240),
        max: (3840),
        step: (2),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    const __VLS_88 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        value: (__VLS_ctx.resizeForm.width),
        min: (120),
        ...{ style: {} },
    }));
    const __VLS_90 = __VLS_89({
        value: (__VLS_ctx.resizeForm.width),
        min: (120),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('height_label'));
    (__VLS_ctx.resizeForm.height);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_92 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        value: (__VLS_ctx.resizeForm.height),
        min: (240),
        max: (2160),
        step: (2),
        ...{ style: {} },
    }));
    const __VLS_94 = __VLS_93({
        value: (__VLS_ctx.resizeForm.height),
        min: (240),
        max: (2160),
        step: (2),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    const __VLS_96 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        value: (__VLS_ctx.resizeForm.height),
        min: (120),
        ...{ style: {} },
    }));
    const __VLS_98 = __VLS_97({
        value: (__VLS_ctx.resizeForm.height),
        min: (120),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    const __VLS_100 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        size: (10),
    }));
    const __VLS_102 = __VLS_101({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    __VLS_103.slots.default;
    const __VLS_104 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_106 = __VLS_105({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    let __VLS_108;
    let __VLS_109;
    let __VLS_110;
    const __VLS_111 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'resize'))
                return;
            __VLS_ctx.runOp('resize');
        }
    };
    __VLS_107.slots.default;
    (__VLS_ctx.t('btn_resize_file'));
    var __VLS_107;
    const __VLS_112 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_114 = __VLS_113({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    let __VLS_116;
    let __VLS_117;
    let __VLS_118;
    const __VLS_119 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'resize'))
                return;
            __VLS_ctx.runBatch('resize');
        }
    };
    __VLS_115.slots.default;
    (__VLS_ctx.t('btn_resize_queue'));
    var __VLS_115;
    var __VLS_103;
}
if (__VLS_ctx.subGeom === 'rotate') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('rotate_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_120 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.rotateForm.angle !== 90),
        type: (__VLS_ctx.rotateForm.angle === 90 ? 'primary' : 'default'),
    }));
    const __VLS_122 = __VLS_121({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.rotateForm.angle !== 90),
        type: (__VLS_ctx.rotateForm.angle === 90 ? 'primary' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    let __VLS_124;
    let __VLS_125;
    let __VLS_126;
    const __VLS_127 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'rotate'))
                return;
            __VLS_ctx.rotateForm.angle = 90;
        }
    };
    __VLS_123.slots.default;
    (__VLS_ctx.t('rot_90_cw'));
    var __VLS_123;
    const __VLS_128 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.rotateForm.angle !== 180),
        type: (__VLS_ctx.rotateForm.angle === 180 ? 'primary' : 'default'),
    }));
    const __VLS_130 = __VLS_129({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.rotateForm.angle !== 180),
        type: (__VLS_ctx.rotateForm.angle === 180 ? 'primary' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    let __VLS_132;
    let __VLS_133;
    let __VLS_134;
    const __VLS_135 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'rotate'))
                return;
            __VLS_ctx.rotateForm.angle = 180;
        }
    };
    __VLS_131.slots.default;
    (__VLS_ctx.t('rot_180'));
    var __VLS_131;
    const __VLS_136 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_137 = __VLS_asFunctionalComponent(__VLS_136, new __VLS_136({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.rotateForm.angle !== 270),
        type: (__VLS_ctx.rotateForm.angle === 270 ? 'primary' : 'default'),
    }));
    const __VLS_138 = __VLS_137({
        ...{ 'onClick': {} },
        secondary: (__VLS_ctx.rotateForm.angle !== 270),
        type: (__VLS_ctx.rotateForm.angle === 270 ? 'primary' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_137));
    let __VLS_140;
    let __VLS_141;
    let __VLS_142;
    const __VLS_143 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'rotate'))
                return;
            __VLS_ctx.rotateForm.angle = 270;
        }
    };
    __VLS_139.slots.default;
    (__VLS_ctx.t('rot_270'));
    var __VLS_139;
    const __VLS_144 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_145 = __VLS_asFunctionalComponent(__VLS_144, new __VLS_144({
        size: (10),
    }));
    const __VLS_146 = __VLS_145({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_145));
    __VLS_147.slots.default;
    const __VLS_148 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_150 = __VLS_149({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_149));
    let __VLS_152;
    let __VLS_153;
    let __VLS_154;
    const __VLS_155 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'rotate'))
                return;
            __VLS_ctx.runOp('rotate');
        }
    };
    __VLS_151.slots.default;
    (__VLS_ctx.t('btn_rotate_file'));
    var __VLS_151;
    const __VLS_156 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_158 = __VLS_157({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_157));
    let __VLS_160;
    let __VLS_161;
    let __VLS_162;
    const __VLS_163 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'rotate'))
                return;
            __VLS_ctx.runBatch('rotate');
        }
    };
    __VLS_159.slots.default;
    (__VLS_ctx.t('btn_rotate_queue'));
    var __VLS_159;
    var __VLS_147;
}
if (__VLS_ctx.subGeom === 'fps') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('fps_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('target_fps'));
    (__VLS_ctx.fpsForm.fps);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_164 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
        value: (__VLS_ctx.fpsForm.fps),
        min: (10),
        max: (120),
        step: (1),
        ...{ style: {} },
    }));
    const __VLS_166 = __VLS_165({
        value: (__VLS_ctx.fpsForm.fps),
        min: (10),
        max: (120),
        step: (1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_165));
    const __VLS_168 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_169 = __VLS_asFunctionalComponent(__VLS_168, new __VLS_168({
        value: (__VLS_ctx.fpsForm.fps),
        min: (1),
        max: (240),
        ...{ style: {} },
    }));
    const __VLS_170 = __VLS_169({
        value: (__VLS_ctx.fpsForm.fps),
        min: (1),
        max: (240),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_169));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_172 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_174 = __VLS_173({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_173));
    let __VLS_176;
    let __VLS_177;
    let __VLS_178;
    const __VLS_179 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'fps'))
                return;
            __VLS_ctx.fpsForm.fps = 24;
        }
    };
    __VLS_175.slots.default;
    (__VLS_ctx.t('fps_24'));
    var __VLS_175;
    const __VLS_180 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_182 = __VLS_181({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_181));
    let __VLS_184;
    let __VLS_185;
    let __VLS_186;
    const __VLS_187 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'fps'))
                return;
            __VLS_ctx.fpsForm.fps = 30;
        }
    };
    __VLS_183.slots.default;
    (__VLS_ctx.t('fps_30'));
    var __VLS_183;
    const __VLS_188 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_190 = __VLS_189({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_189));
    let __VLS_192;
    let __VLS_193;
    let __VLS_194;
    const __VLS_195 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'fps'))
                return;
            __VLS_ctx.fpsForm.fps = 60;
        }
    };
    __VLS_191.slots.default;
    (__VLS_ctx.t('fps_60'));
    var __VLS_191;
    const __VLS_196 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_198 = __VLS_197({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_197));
    let __VLS_200;
    let __VLS_201;
    let __VLS_202;
    const __VLS_203 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'fps'))
                return;
            __VLS_ctx.fpsForm.fps = 120;
        }
    };
    __VLS_199.slots.default;
    var __VLS_199;
    const __VLS_204 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
        size: (10),
    }));
    const __VLS_206 = __VLS_205({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_205));
    __VLS_207.slots.default;
    const __VLS_208 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_210 = __VLS_209({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_209));
    let __VLS_212;
    let __VLS_213;
    let __VLS_214;
    const __VLS_215 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'fps'))
                return;
            __VLS_ctx.runOp('change_fps');
        }
    };
    __VLS_211.slots.default;
    (__VLS_ctx.t('btn_fps_file'));
    var __VLS_211;
    const __VLS_216 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_218 = __VLS_217({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_217));
    let __VLS_220;
    let __VLS_221;
    let __VLS_222;
    const __VLS_223 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subGeom === 'fps'))
                return;
            __VLS_ctx.runBatch('change_fps');
        }
    };
    __VLS_219.slots.default;
    (__VLS_ctx.t('btn_fps_queue'));
    var __VLS_219;
    var __VLS_207;
}
/** @type {__VLS_StyleScopedClasses['studio-subtabs']} */ ;
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
/** @type {__VLS_StyleScopedClasses['is-crop']} */ ;
/** @type {__VLS_StyleScopedClasses['crop-rule-of-thirds']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-crop-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['handle-br']} */ ;
/** @type {__VLS_StyleScopedClasses['is-crop-handle']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-video-toolbar']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-play-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-timecode']} */ ;
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
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NSlider: NSlider,
            NInputNumber: NInputNumber,
            NTag: NTag,
            NFlex: NFlex,
            t: t,
            queueStore: queueStore,
            subGeom: subGeom,
            stageRef: stageRef,
            isStagePlaying: isStagePlaying,
            cropForm: cropForm,
            resizeForm: resizeForm,
            rotateForm: rotateForm,
            fpsForm: fpsForm,
            viewportStyle: viewportStyle,
            cropBoxStyle: cropBoxStyle,
            onStageMouseDown: onStageMouseDown,
            onStartMoveCrop: onStartMoveCrop,
            onStartResizeCrop: onStartResizeCrop,
            toggleStagePlayback: toggleStagePlayback,
            onVideoError: onVideoError,
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
//# sourceMappingURL=GeometryView.vue.js.map
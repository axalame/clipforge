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
    }
    else if (queueStore.fileQueue.length > 0) {
        queueStore.removeFile(queueStore.fileQueue[0].path);
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
    ...{ class: "studio-sidebar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-brand" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-mark" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    stroke: "currentColor",
    'stroke-width': "2.2",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
    points: "5 3 19 12 5 21 5 3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "brand-title" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-source-box" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "source-label" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('active_file'));
if (__VLS_ctx.queueStore.fileQueue.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.queueStore.selectedIndex + 1);
    (__VLS_ctx.queueStore.fileQueue.length);
}
if (__VLS_ctx.queueStore.activeFileName) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "source-file-badge" },
        title: (__VLS_ctx.queueStore.activeFilePath),
        ...{ style: {} },
    });
    if (__VLS_ctx.queueStore.activeFrameSrc) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.queueStore.activeFrameSrc),
            ...{ style: {} },
        });
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "13",
            height: "13",
            stroke: "currentColor",
            'stroke-width': "2",
            fill: "none",
            'stroke-linecap': "round",
            'stroke-linejoin': "round",
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
            x: "2",
            y: "2",
            width: "20",
            height: "20",
            rx: "2",
            ry: "2",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
            x1: "7",
            y1: "2",
            x2: "7",
            y2: "22",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.queueStore.activeFileName);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.handleRemoveActiveFile) },
        ...{ class: "badge-remove-btn" },
        title: (__VLS_ctx.t('remove_active_file') || 'Удалить активный файл'),
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "12",
        height: "12",
        stroke: "currentColor",
        'stroke-width': "2",
        fill: "none",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line, __VLS_intrinsicElements.line)({
        x1: "18",
        y1: "6",
        x2: "6",
        y2: "18",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line, __VLS_intrinsicElements.line)({
        x1: "6",
        y1: "6",
        x2: "18",
        y2: "18",
    });
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_0 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
        ...{ style: {} },
    }));
    const __VLS_2 = __VLS_1({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    let __VLS_4;
    let __VLS_5;
    let __VLS_6;
    const __VLS_7 = {
        onClick: (__VLS_ctx.handlePickFiles)
    };
    __VLS_3.slots.default;
    (__VLS_ctx.t('add_files'));
    var __VLS_3;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.nav, __VLS_intrinsicElements.nav)({
    ...{ class: "sidebar-nav" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appStore.activeNav = 'download';
        } },
    ...{ class: "nav-item" },
    ...{ class: ({ 'is-active': __VLS_ctx.appStore.activeNav === 'download' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    stroke: "currentColor",
    'stroke-width': "1.8",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "7 10 12 15 17 10",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "12",
    y1: "15",
    x2: "12",
    y2: "3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('nav_download'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appStore.activeNav = 'trim';
        } },
    ...{ class: "nav-item" },
    ...{ class: ({ 'is-active': __VLS_ctx.appStore.activeNav === 'trim' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    stroke: "currentColor",
    'stroke-width': "1.8",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "6",
    cy: "6",
    r: "3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "6",
    cy: "18",
    r: "3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "20",
    y1: "4",
    x2: "8.12",
    y2: "15.88",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "14.47",
    y1: "14.48",
    x2: "20",
    y2: "20",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "8.12",
    y1: "8.12",
    x2: "12",
    y2: "12",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('nav_trim'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appStore.activeNav = 'geometry';
        } },
    ...{ class: "nav-item" },
    ...{ class: ({ 'is-active': __VLS_ctx.appStore.activeNav === 'geometry' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    stroke: "currentColor",
    'stroke-width': "1.8",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M6.13 1L6 16a2 2 0 0 0 2 2h15",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M1 6.13L16 6a2 2 0 0 1 2 2v15",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('nav_geometry'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appStore.activeNav = 'effects';
        } },
    ...{ class: "nav-item" },
    ...{ class: ({ 'is-active': __VLS_ctx.appStore.activeNav === 'effects' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    stroke: "currentColor",
    'stroke-width': "1.8",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
    points: "12 2 2 7 12 12 22 7 12 2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "2 17 12 22 22 17",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "2 12 12 17 22 12",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('nav_effects'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appStore.activeNav = 'audio';
        } },
    ...{ class: "nav-item" },
    ...{ class: ({ 'is-active': __VLS_ctx.appStore.activeNav === 'audio' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    stroke: "currentColor",
    'stroke-width': "1.8",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
    points: "11 5 6 9 2 9 2 15 6 15 11 19 11 5",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('nav_audio'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appStore.activeNav = 'export';
        } },
    ...{ class: "nav-item" },
    ...{ class: ({ 'is-active': __VLS_ctx.appStore.activeNav === 'export' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    stroke: "currentColor",
    'stroke-width': "1.8",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "4",
    y1: "21",
    x2: "4",
    y2: "14",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "4",
    y1: "10",
    x2: "4",
    y2: "3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "12",
    y1: "21",
    x2: "12",
    y2: "12",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "20",
    y1: "21",
    x2: "20",
    y2: "16",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "20",
    y1: "12",
    x2: "20",
    y2: "3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "1",
    y1: "14",
    x2: "7",
    y2: "14",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "9",
    y1: "8",
    x2: "15",
    y2: "8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "17",
    y1: "16",
    x2: "23",
    y2: "16",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('nav_export'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appStore.activeNav = 'media';
        } },
    ...{ class: "nav-item" },
    ...{ class: ({ 'is-active': __VLS_ctx.appStore.activeNav === 'media' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    stroke: "currentColor",
    'stroke-width': "1.8",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "2",
    y: "2",
    width: "20",
    height: "20",
    rx: "2.18",
    ry: "2.18",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "7",
    y1: "2",
    x2: "7",
    y2: "22",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "17",
    y1: "2",
    x2: "17",
    y2: "22",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "2",
    y1: "12",
    x2: "22",
    y2: "12",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('nav_media'));
if (__VLS_ctx.queueStore.fileQueue.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.queueStore.fileQueue.length);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.appStore.activeNav = 'settings';
        } },
    ...{ class: "nav-item" },
    ...{ class: ({ 'is-active': __VLS_ctx.appStore.activeNav === 'settings' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "16",
    height: "16",
    stroke: "currentColor",
    'stroke-width': "1.8",
    fill: "none",
    'stroke-linecap': "round",
    'stroke-linejoin': "round",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "12",
    cy: "12",
    r: "3",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('nav_settings'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "sidebar-footer" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-dot" },
    ...{ class: (__VLS_ctx.configStore.toolStatuses.ffmpeg.ok ? 'is-ok' : 'is-err') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.configStore.toolStatuses.ffmpeg.ok ? __VLS_ctx.t('status_active') : __VLS_ctx.t('status_error'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-dot" },
    ...{ class: (__VLS_ctx.configStore.toolStatuses.ytdlp.ok ? 'is-ok' : 'is-err') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.configStore.toolStatuses.ytdlp.ok ? __VLS_ctx.t('status_active') : __VLS_ctx.t('status_error'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-dot" },
    ...{ class: (__VLS_ctx.configStore.toolStatuses.deno.ok ? 'is-ok' : 'is-err') },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.configStore.toolStatuses.deno.ok ? __VLS_ctx.t('status_active') : __VLS_ctx.t('status_error'));
/** @type {__VLS_StyleScopedClasses['studio-sidebar']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-brand']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-mark']} */ ;
/** @type {__VLS_StyleScopedClasses['brand-title']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-source-box']} */ ;
/** @type {__VLS_StyleScopedClasses['source-label']} */ ;
/** @type {__VLS_StyleScopedClasses['source-file-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['badge-remove-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['nav-item']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-footer']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-dot']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-dot']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            t: t,
            appStore: appStore,
            queueStore: queueStore,
            configStore: configStore,
            handlePickFiles: handlePickFiles,
            handleRemoveActiveFile: handleRemoveActiveFile,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=Sidebar.vue.js.map
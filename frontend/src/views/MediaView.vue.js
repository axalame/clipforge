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
const selectFile = (idx) => {
    queueStore.selectFile(queueStore.fileQueue[idx]);
};
const removeFile = (idx) => {
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
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "media-layout" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "media-queue-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ style: {} },
});
(__VLS_ctx.t('queue_files'));
(__VLS_ctx.queueStore.fileQueue.length);
const __VLS_0 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    size: "tiny",
    secondary: true,
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    size: "tiny",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.clearFiles)
};
__VLS_3.slots.default;
(__VLS_ctx.t('clear_all'));
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
for (const [f, idx] of __VLS_getVForSourceType((__VLS_ctx.queueStore.fileQueue))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                __VLS_ctx.selectFile(idx);
            } },
        key: (idx),
        ...{ class: "queue-item-card" },
        ...{ style: {} },
        ...{ style: ({
                borderColor: idx === __VLS_ctx.queueStore.selectedIndex ? '#10b981' : (__VLS_ctx.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.09)'),
                background: idx === __VLS_ctx.queueStore.selectedIndex ? (__VLS_ctx.isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.1)') : 'var(--bg-panel)'
            }) },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "queue-item-title" },
        ...{ style: {} },
    });
    (f.path.split(/[\\/]/).pop());
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (f.path);
    const __VLS_8 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        ...{ 'onClick': {} },
        size: "tiny",
        quaternary: true,
        circle: true,
        title: (__VLS_ctx.t('delete_from_queue')),
    }));
    const __VLS_10 = __VLS_9({
        ...{ 'onClick': {} },
        size: "tiny",
        quaternary: true,
        circle: true,
        title: (__VLS_ctx.t('delete_from_queue')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    let __VLS_12;
    let __VLS_13;
    let __VLS_14;
    const __VLS_15 = {
        onClick: (...[$event]) => {
            __VLS_ctx.removeFile(idx);
        }
    };
    __VLS_11.slots.default;
    var __VLS_11;
}
if (__VLS_ctx.queueStore.fileQueue.length === 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('queue_empty'));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "media-preview-col" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "native-video-wrapper" },
    ...{ class: ({ 'has-video': __VLS_ctx.queueStore.activeVideoSrc && !__VLS_ctx.queueStore.hasVideoError }) },
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.video, __VLS_intrinsicElements.video)({
    ...{ onError: (__VLS_ctx.onVideoError) },
    id: "native-preview-video",
    src: (__VLS_ctx.queueStore.activeVideoSrc),
    poster: (__VLS_ctx.queueStore.activeFrameSrc),
    controls: true,
    playsinline: true,
    ...{ style: {} },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.queueStore.activeVideoSrc && !__VLS_ctx.queueStore.hasVideoError) }, null, null);
if (__VLS_ctx.queueStore.activeFrameSrc && __VLS_ctx.queueStore.hasVideoError) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        src: (__VLS_ctx.queueStore.activeFrameSrc),
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('format_requires_player'));
    const __VLS_16 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        size: "tiny",
        type: "primary",
        secondary: true,
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        size: "tiny",
        type: "primary",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (__VLS_ctx.openInWindowsPlayer)
    };
    __VLS_19.slots.default;
    (__VLS_ctx.t('open_in_windows_player'));
    var __VLS_19;
}
if (!__VLS_ctx.queueStore.activeVideoSrc) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "20",
        height: "20",
        stroke: "currentColor",
        'stroke-width': "1.8",
        fill: "none",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
        points: "5 3 19 12 5 21 5 3",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('select_video_left'));
}
if (__VLS_ctx.queueStore.selectedMediaInfo && __VLS_ctx.queueStore.selectedMediaInfo.ok) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('tech_specs'));
    const __VLS_24 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_26 = __VLS_25({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    let __VLS_28;
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = {
        onClick: (__VLS_ctx.openInWindowsPlayer)
    };
    __VLS_27.slots.default;
    (__VLS_ctx.t('in_windows_player'));
    var __VLS_27;
    const __VLS_32 = {}.NTable;
    /** @type {[typeof __VLS_components.NTable, typeof __VLS_components.nTable, typeof __VLS_components.NTable, typeof __VLS_components.nTable, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        size: "small",
        bordered: (false),
        singleLine: (false),
        ...{ style: {} },
    }));
    const __VLS_34 = __VLS_33({
        size: "small",
        bordered: (false),
        singleLine: (false),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tbody, __VLS_intrinsicElements.tbody)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('duration'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.queueStore.selectedMediaInfo.duration_str);
    (__VLS_ctx.queueStore.selectedMediaInfo.duration);
    (__VLS_ctx.t('sec_unit'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('resolution'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.queueStore.selectedMediaInfo.video?.resolution);
    (__VLS_ctx.queueStore.selectedMediaInfo.video?.aspect_ratio);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('video_codec'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.queueStore.selectedMediaInfo.video?.codec_long);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('framerate'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.queueStore.selectedMediaInfo.video?.fps);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('audio_codec'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.queueStore.selectedMediaInfo.audio?.codec_long);
    (__VLS_ctx.queueStore.selectedMediaInfo.audio?.sample_rate);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.tr, __VLS_intrinsicElements.tr)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('bitrate_size'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.td, __VLS_intrinsicElements.td)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.queueStore.selectedMediaInfo.bitrate_kbps);
    (__VLS_ctx.queueStore.selectedMediaInfo.size_mb);
    (__VLS_ctx.t('mb_short'));
    var __VLS_35;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
        ...{ style: {} },
    });
    (__VLS_ctx.t('inspect_placeholder'));
}
/** @type {__VLS_StyleScopedClasses['media-layout']} */ ;
/** @type {__VLS_StyleScopedClasses['media-queue-col']} */ ;
/** @type {__VLS_StyleScopedClasses['queue-item-card']} */ ;
/** @type {__VLS_StyleScopedClasses['queue-item-title']} */ ;
/** @type {__VLS_StyleScopedClasses['media-preview-col']} */ ;
/** @type {__VLS_StyleScopedClasses['native-video-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NTable: NTable,
            t: t,
            queueStore: queueStore,
            isDark: isDark,
            selectFile: selectFile,
            removeFile: removeFile,
            clearFiles: clearFiles,
            onVideoError: onVideoError,
            openInWindowsPlayer: openInWindowsPlayer,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=MediaView.vue.js.map
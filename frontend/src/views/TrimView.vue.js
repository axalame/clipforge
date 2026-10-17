import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NSlider, NInputNumber, NTag, NFlex, NRadioGroup, NRadio, NSpace, NSwitch, useMessage, } from "naive-ui";
import { useQueueStore } from "@/stores/queue";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";
const { t } = useI18n();
const message = useMessage();
const queueStore = useQueueStore();
const configStore = useConfigStore();
const subTrim = ref("trim");
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
const formatSec = (s) => {
    if (isNaN(s) || s < 0)
        return "00:00.0";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    const ms = Math.floor((s % 1) * 10);
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}.${ms}`;
};
const currentTrimTimeFormatted = computed(() => formatSec(currentTrimTime.value));
const onTrimVideoTimeUpdate = (e) => {
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
const runOp = async (op) => {
    if (!queueStore.activeFilePath) {
        message.warning(t("msg_select_first"));
        return;
    }
    const params = {};
    if (configStore.config.output_dir)
        params.output_dir = configStore.config.output_dir;
    if (op === "trim") {
        params.start = trimForm.value.start;
        params.end = trimForm.value.end;
    }
    else if (op === "split") {
        params.chunk_duration = splitForm.value.chunk_duration;
    }
    else if (op === "change_speed") {
        params.speed = speedForm.value.speed;
        params.audio_mode = speedForm.value.audio_mode;
        params.audio_speed = speedForm.value.audio_speed;
        params.keep_pitch = speedForm.value.keep_pitch;
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
    if (op === "trim") {
        params.start = trimForm.value.start;
        params.end = trimForm.value.end;
    }
    else if (op === "split") {
        params.chunk_duration = splitForm.value.chunk_duration;
    }
    else if (op === "change_speed") {
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
    const params = { files: paths };
    if (configStore.config.output_dir)
        params.output_dir = configStore.config.output_dir;
    await apiClient.startOperation("merge_videos", paths[0], params);
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
            __VLS_ctx.subTrim = 'trim';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subTrim === 'trim' }) },
});
(__VLS_ctx.t('sub_trim_cut'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subTrim = 'split';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subTrim === 'split' }) },
});
(__VLS_ctx.t('sub_trim_split'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subTrim = 'speed';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subTrim === 'speed' }) },
});
(__VLS_ctx.t('sub_trim_speed'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subTrim = 'merge';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subTrim === 'merge' }) },
});
(__VLS_ctx.t('sub_trim_merge'));
if (__VLS_ctx.subTrim === 'trim') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "interactive-stage-card" },
        ...{ style: {} },
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
    (__VLS_ctx.t('trim_preview_title'));
    if (__VLS_ctx.queueStore.activeVideoSrc) {
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
        (__VLS_ctx.t('player_ready'));
        var __VLS_3;
    }
    else {
        const __VLS_4 = {}.NTag;
        /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
        // @ts-ignore
        const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
            size: "tiny",
            type: "warning",
            round: true,
        }));
        const __VLS_6 = __VLS_5({
            size: "tiny",
            type: "warning",
            round: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_5));
        __VLS_7.slots.default;
        (__VLS_ctx.t('no_file_chosen'));
        var __VLS_7;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('trim_hint'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.video, __VLS_intrinsicElements.video)({
        ...{ onTimeupdate: (__VLS_ctx.onTrimVideoTimeUpdate) },
        ...{ onError: (__VLS_ctx.onVideoError) },
        id: "trim-preview-video",
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
        (__VLS_ctx.t('video_format_label'));
        const __VLS_8 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
            ...{ 'onClick': {} },
            size: "tiny",
            type: "primary",
            secondary: true,
        }));
        const __VLS_10 = __VLS_9({
            ...{ 'onClick': {} },
            size: "tiny",
            type: "primary",
            secondary: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        let __VLS_12;
        let __VLS_13;
        let __VLS_14;
        const __VLS_15 = {
            onClick: (__VLS_ctx.openInWindowsPlayer)
        };
        __VLS_11.slots.default;
        (__VLS_ctx.t('open_in_windows_player'));
        var __VLS_11;
    }
    if (!__VLS_ctx.queueStore.activeVideoSrc) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "stage-placeholder-grid" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "placeholder-hint" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('trim_choose_left'));
    }
    if (__VLS_ctx.queueStore.activeVideoSrc) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        (__VLS_ctx.t('current_frame'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({
            ...{ style: {} },
        });
        (__VLS_ctx.currentTrimTimeFormatted);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_16 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
            ...{ 'onClick': {} },
            size: "tiny",
            secondary: true,
            type: "primary",
        }));
        const __VLS_18 = __VLS_17({
            ...{ 'onClick': {} },
            size: "tiny",
            secondary: true,
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_17));
        let __VLS_20;
        let __VLS_21;
        let __VLS_22;
        const __VLS_23 = {
            onClick: (__VLS_ctx.setTrimStartFromCurrent)
        };
        __VLS_19.slots.default;
        (__VLS_ctx.t('btn_set_start'));
        var __VLS_19;
        const __VLS_24 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
            ...{ 'onClick': {} },
            size: "tiny",
            secondary: true,
            type: "info",
        }));
        const __VLS_26 = __VLS_25({
            ...{ 'onClick': {} },
            size: "tiny",
            secondary: true,
            type: "info",
        }, ...__VLS_functionalComponentArgsRest(__VLS_25));
        let __VLS_28;
        let __VLS_29;
        let __VLS_30;
        const __VLS_31 = {
            onClick: (__VLS_ctx.setTrimEndFromCurrent)
        };
        __VLS_27.slots.default;
        (__VLS_ctx.t('btn_set_end'));
        var __VLS_27;
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('trim_params_title'));
    const __VLS_32 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        size: "small",
        type: "success",
        round: true,
    }));
    const __VLS_34 = __VLS_33({
        size: "small",
        type: "success",
        round: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    __VLS_35.slots.default;
    (__VLS_ctx.trimForm.start);
    (__VLS_ctx.t('sec_unit'));
    (__VLS_ctx.trimForm.end);
    (__VLS_ctx.t('sec_unit'));
    ((__VLS_ctx.trimEndTotal).toFixed(1));
    (__VLS_ctx.t('sec_unit'));
    var __VLS_35;
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
    (__VLS_ctx.t('time_start_label'));
    (__VLS_ctx.trimForm.start);
    (__VLS_ctx.t('sec_unit'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_36 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        value: (__VLS_ctx.trimForm.start),
        min: (0),
        max: (Math.max(30, __VLS_ctx.queueStore.selectedMediaInfo?.duration || 120)),
        step: (0.1),
        ...{ style: {} },
    }));
    const __VLS_38 = __VLS_37({
        value: (__VLS_ctx.trimForm.start),
        min: (0),
        max: (Math.max(30, __VLS_ctx.queueStore.selectedMediaInfo?.duration || 120)),
        step: (0.1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    const __VLS_40 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        value: (__VLS_ctx.trimForm.start),
        min: (0),
        step: (0.1),
        ...{ style: {} },
    }));
    const __VLS_42 = __VLS_41({
        value: (__VLS_ctx.trimForm.start),
        min: (0),
        step: (0.1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('time_end_label'));
    (__VLS_ctx.trimForm.end);
    (__VLS_ctx.t('sec_unit'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_44 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        value: (__VLS_ctx.trimForm.end),
        min: (0),
        max: (Math.max(30, __VLS_ctx.queueStore.selectedMediaInfo?.duration || 120)),
        step: (0.1),
        ...{ style: {} },
    }));
    const __VLS_46 = __VLS_45({
        value: (__VLS_ctx.trimForm.end),
        min: (0),
        max: (Math.max(30, __VLS_ctx.queueStore.selectedMediaInfo?.duration || 120)),
        step: (0.1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    const __VLS_48 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        value: (__VLS_ctx.trimForm.end),
        min: (0),
        step: (0.1),
        ...{ style: {} },
    }));
    const __VLS_50 = __VLS_49({
        value: (__VLS_ctx.trimForm.end),
        min: (0),
        step: (0.1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    const __VLS_52 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        size: (10),
    }));
    const __VLS_54 = __VLS_53({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    __VLS_55.slots.default;
    const __VLS_56 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_58 = __VLS_57({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    let __VLS_60;
    let __VLS_61;
    let __VLS_62;
    const __VLS_63 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'trim'))
                return;
            __VLS_ctx.runOp('trim');
        }
    };
    __VLS_59.slots.default;
    (__VLS_ctx.t('btn_trim_file'));
    var __VLS_59;
    const __VLS_64 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_66 = __VLS_65({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    let __VLS_68;
    let __VLS_69;
    let __VLS_70;
    const __VLS_71 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'trim'))
                return;
            __VLS_ctx.runBatch('trim');
        }
    };
    __VLS_67.slots.default;
    (__VLS_ctx.t('btn_trim_queue'));
    var __VLS_67;
    var __VLS_55;
}
if (__VLS_ctx.subTrim === 'split') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('split_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('split_duration_label'));
    (__VLS_ctx.splitForm.chunk_duration);
    (__VLS_ctx.t('sec_unit'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_72 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        value: (__VLS_ctx.splitForm.chunk_duration),
        min: (5),
        max: (300),
        step: (5),
        ...{ style: {} },
    }));
    const __VLS_74 = __VLS_73({
        value: (__VLS_ctx.splitForm.chunk_duration),
        min: (5),
        max: (300),
        step: (5),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    const __VLS_76 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
        value: (__VLS_ctx.splitForm.chunk_duration),
        min: (1),
        max: (3600),
        ...{ style: {} },
    }));
    const __VLS_78 = __VLS_77({
        value: (__VLS_ctx.splitForm.chunk_duration),
        min: (1),
        max: (3600),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_77));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_80 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_82 = __VLS_81({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    let __VLS_84;
    let __VLS_85;
    let __VLS_86;
    const __VLS_87 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'split'))
                return;
            __VLS_ctx.splitForm.chunk_duration = 15;
        }
    };
    __VLS_83.slots.default;
    (__VLS_ctx.t('split_15s'));
    var __VLS_83;
    const __VLS_88 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_90 = __VLS_89({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    let __VLS_92;
    let __VLS_93;
    let __VLS_94;
    const __VLS_95 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'split'))
                return;
            __VLS_ctx.splitForm.chunk_duration = 30;
        }
    };
    __VLS_91.slots.default;
    (__VLS_ctx.t('split_30s'));
    var __VLS_91;
    const __VLS_96 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_98 = __VLS_97({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    let __VLS_100;
    let __VLS_101;
    let __VLS_102;
    const __VLS_103 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'split'))
                return;
            __VLS_ctx.splitForm.chunk_duration = 60;
        }
    };
    __VLS_99.slots.default;
    (__VLS_ctx.t('split_60s'));
    var __VLS_99;
    const __VLS_104 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_106 = __VLS_105({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_105));
    let __VLS_108;
    let __VLS_109;
    let __VLS_110;
    const __VLS_111 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'split'))
                return;
            __VLS_ctx.splitForm.chunk_duration = 180;
        }
    };
    __VLS_107.slots.default;
    (__VLS_ctx.t('split_3m'));
    var __VLS_107;
    const __VLS_112 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_114 = __VLS_113({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_113));
    let __VLS_116;
    let __VLS_117;
    let __VLS_118;
    const __VLS_119 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'split'))
                return;
            __VLS_ctx.runOp('split');
        }
    };
    __VLS_115.slots.default;
    (__VLS_ctx.t('btn_split_file'));
    var __VLS_115;
}
if (__VLS_ctx.subTrim === 'speed') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('speed_title'));
    const __VLS_120 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        size: "small",
        type: "success",
        round: true,
    }));
    const __VLS_122 = __VLS_121({
        size: "small",
        type: "success",
        round: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    __VLS_123.slots.default;
    (__VLS_ctx.t('speed_video_tag'));
    (__VLS_ctx.speedForm.speed);
    var __VLS_123;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('speed_video_label'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_124 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        value: (__VLS_ctx.speedForm.speed),
        min: (0.25),
        max: (8),
        step: (0.25),
        ...{ style: {} },
    }));
    const __VLS_126 = __VLS_125({
        value: (__VLS_ctx.speedForm.speed),
        min: (0.25),
        max: (8),
        step: (0.25),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    const __VLS_128 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
        value: (__VLS_ctx.speedForm.speed),
        min: (0.25),
        max: (10),
        step: (0.25),
        ...{ style: {} },
    }));
    const __VLS_130 = __VLS_129({
        value: (__VLS_ctx.speedForm.speed),
        min: (0.25),
        max: (10),
        step: (0.25),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_129));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
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
            if (!(__VLS_ctx.subTrim === 'speed'))
                return;
            __VLS_ctx.speedForm.speed = 0.5;
        }
    };
    __VLS_135.slots.default;
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
            if (!(__VLS_ctx.subTrim === 'speed'))
                return;
            __VLS_ctx.speedForm.speed = 0.75;
        }
    };
    __VLS_143.slots.default;
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
            if (!(__VLS_ctx.subTrim === 'speed'))
                return;
            __VLS_ctx.speedForm.speed = 1.25;
        }
    };
    __VLS_151.slots.default;
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
            if (!(__VLS_ctx.subTrim === 'speed'))
                return;
            __VLS_ctx.speedForm.speed = 1.5;
        }
    };
    __VLS_159.slots.default;
    var __VLS_159;
    const __VLS_164 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }));
    const __VLS_166 = __VLS_165({
        ...{ 'onClick': {} },
        size: "tiny",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_165));
    let __VLS_168;
    let __VLS_169;
    let __VLS_170;
    const __VLS_171 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'speed'))
                return;
            __VLS_ctx.speedForm.speed = 2.0;
        }
    };
    __VLS_167.slots.default;
    var __VLS_167;
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
            if (!(__VLS_ctx.subTrim === 'speed'))
                return;
            __VLS_ctx.speedForm.speed = 4.0;
        }
    };
    __VLS_175.slots.default;
    var __VLS_175;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('audio_mode_label'));
    const __VLS_180 = {}.NRadioGroup;
    /** @type {[typeof __VLS_components.NRadioGroup, typeof __VLS_components.nRadioGroup, typeof __VLS_components.NRadioGroup, typeof __VLS_components.nRadioGroup, ]} */ ;
    // @ts-ignore
    const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
        value: (__VLS_ctx.speedForm.audio_mode),
        name: "audio-mode-group",
    }));
    const __VLS_182 = __VLS_181({
        value: (__VLS_ctx.speedForm.audio_mode),
        name: "audio-mode-group",
    }, ...__VLS_functionalComponentArgsRest(__VLS_181));
    __VLS_183.slots.default;
    const __VLS_184 = {}.NSpace;
    /** @type {[typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, typeof __VLS_components.NSpace, typeof __VLS_components.nSpace, ]} */ ;
    // @ts-ignore
    const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
        vertical: true,
    }));
    const __VLS_186 = __VLS_185({
        vertical: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_185));
    __VLS_187.slots.default;
    const __VLS_188 = {}.NRadio;
    /** @type {[typeof __VLS_components.NRadio, typeof __VLS_components.nRadio, typeof __VLS_components.NRadio, typeof __VLS_components.nRadio, ]} */ ;
    // @ts-ignore
    const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
        value: "sync",
    }));
    const __VLS_190 = __VLS_189({
        value: "sync",
    }, ...__VLS_functionalComponentArgsRest(__VLS_189));
    __VLS_191.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.t('audio_mode_sync'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('audio_mode_sync_desc'));
    var __VLS_191;
    const __VLS_192 = {}.NRadio;
    /** @type {[typeof __VLS_components.NRadio, typeof __VLS_components.nRadio, typeof __VLS_components.NRadio, typeof __VLS_components.nRadio, ]} */ ;
    // @ts-ignore
    const __VLS_193 = __VLS_asFunctionalComponent(__VLS_192, new __VLS_192({
        value: "keep_original",
    }));
    const __VLS_194 = __VLS_193({
        value: "keep_original",
    }, ...__VLS_functionalComponentArgsRest(__VLS_193));
    __VLS_195.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('audio_mode_original'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('audio_mode_original_desc'));
    var __VLS_195;
    const __VLS_196 = {}.NRadio;
    /** @type {[typeof __VLS_components.NRadio, typeof __VLS_components.nRadio, typeof __VLS_components.NRadio, typeof __VLS_components.nRadio, ]} */ ;
    // @ts-ignore
    const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
        value: "custom",
    }));
    const __VLS_198 = __VLS_197({
        value: "custom",
    }, ...__VLS_functionalComponentArgsRest(__VLS_197));
    __VLS_199.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.t('audio_mode_custom'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('audio_mode_custom_desc'));
    var __VLS_199;
    const __VLS_200 = {}.NRadio;
    /** @type {[typeof __VLS_components.NRadio, typeof __VLS_components.nRadio, typeof __VLS_components.NRadio, typeof __VLS_components.nRadio, ]} */ ;
    // @ts-ignore
    const __VLS_201 = __VLS_asFunctionalComponent(__VLS_200, new __VLS_200({
        value: "mute",
    }));
    const __VLS_202 = __VLS_201({
        value: "mute",
    }, ...__VLS_functionalComponentArgsRest(__VLS_201));
    __VLS_203.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
    (__VLS_ctx.t('audio_mode_mute'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('audio_mode_mute_desc'));
    var __VLS_203;
    var __VLS_187;
    var __VLS_183;
    if (__VLS_ctx.speedForm.audio_mode === 'custom') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "form-field" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "field-label" },
        });
        (__VLS_ctx.t('audio_speed_label'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        const __VLS_204 = {}.NSlider;
        /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
        // @ts-ignore
        const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
            value: (__VLS_ctx.speedForm.audio_speed),
            min: (0.25),
            max: (8),
            step: (0.25),
            ...{ style: {} },
        }));
        const __VLS_206 = __VLS_205({
            value: (__VLS_ctx.speedForm.audio_speed),
            min: (0.25),
            max: (8),
            step: (0.25),
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_205));
        const __VLS_208 = {}.NInputNumber;
        /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
        // @ts-ignore
        const __VLS_209 = __VLS_asFunctionalComponent(__VLS_208, new __VLS_208({
            value: (__VLS_ctx.speedForm.audio_speed),
            min: (0.25),
            max: (10),
            step: (0.25),
            ...{ style: {} },
        }));
        const __VLS_210 = __VLS_209({
            value: (__VLS_ctx.speedForm.audio_speed),
            min: (0.25),
            max: (10),
            step: (0.25),
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_209));
    }
    if (__VLS_ctx.speedForm.audio_mode !== 'mute') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "form-field" },
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        (__VLS_ctx.t('pitch_preserve_title'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        (__VLS_ctx.t('pitch_preserve_desc'));
        const __VLS_212 = {}.NSwitch;
        /** @type {[typeof __VLS_components.NSwitch, typeof __VLS_components.nSwitch, ]} */ ;
        // @ts-ignore
        const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
            value: (__VLS_ctx.speedForm.keep_pitch),
        }));
        const __VLS_214 = __VLS_213({
            value: (__VLS_ctx.speedForm.keep_pitch),
        }, ...__VLS_functionalComponentArgsRest(__VLS_213));
    }
    const __VLS_216 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_217 = __VLS_asFunctionalComponent(__VLS_216, new __VLS_216({
        size: (10),
    }));
    const __VLS_218 = __VLS_217({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_217));
    __VLS_219.slots.default;
    const __VLS_220 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_222 = __VLS_221({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_221));
    let __VLS_224;
    let __VLS_225;
    let __VLS_226;
    const __VLS_227 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'speed'))
                return;
            __VLS_ctx.runOp('change_speed');
        }
    };
    __VLS_223.slots.default;
    (__VLS_ctx.t('btn_speed_file'));
    var __VLS_223;
    const __VLS_228 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_229 = __VLS_asFunctionalComponent(__VLS_228, new __VLS_228({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_230 = __VLS_229({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_229));
    let __VLS_232;
    let __VLS_233;
    let __VLS_234;
    const __VLS_235 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subTrim === 'speed'))
                return;
            __VLS_ctx.runBatch('change_speed');
        }
    };
    __VLS_231.slots.default;
    (__VLS_ctx.t('btn_speed_queue'));
    var __VLS_231;
    var __VLS_219;
}
if (__VLS_ctx.subTrim === 'merge') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('merge_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('merge_desc'));
    (__VLS_ctx.t('queue_contains'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({
        ...{ style: {} },
    });
    (__VLS_ctx.queueStore.fileQueue.length);
    (__VLS_ctx.t('files_count_unit'));
    const __VLS_236 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_237 = __VLS_asFunctionalComponent(__VLS_236, new __VLS_236({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_238 = __VLS_237({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_237));
    let __VLS_240;
    let __VLS_241;
    let __VLS_242;
    const __VLS_243 = {
        onClick: (__VLS_ctx.runMerge)
    };
    __VLS_239.slots.default;
    (__VLS_ctx.t('btn_merge_queue'));
    var __VLS_239;
}
/** @type {__VLS_StyleScopedClasses['studio-subtabs']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['interactive-stage-card']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-header']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-title']} */ ;
/** @type {__VLS_StyleScopedClasses['stage-placeholder-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['placeholder-hint']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NSlider: NSlider,
            NInputNumber: NInputNumber,
            NTag: NTag,
            NFlex: NFlex,
            NRadioGroup: NRadioGroup,
            NRadio: NRadio,
            NSpace: NSpace,
            NSwitch: NSwitch,
            t: t,
            queueStore: queueStore,
            subTrim: subTrim,
            trimForm: trimForm,
            splitForm: splitForm,
            speedForm: speedForm,
            trimEndTotal: trimEndTotal,
            currentTrimTimeFormatted: currentTrimTimeFormatted,
            onTrimVideoTimeUpdate: onTrimVideoTimeUpdate,
            setTrimStartFromCurrent: setTrimStartFromCurrent,
            setTrimEndFromCurrent: setTrimEndFromCurrent,
            onVideoError: onVideoError,
            openInWindowsPlayer: openInWindowsPlayer,
            runOp: runOp,
            runBatch: runBatch,
            runMerge: runMerge,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=TrimView.vue.js.map
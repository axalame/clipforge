import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NSlider, NInput, NInputNumber, NSelect, NFlex, useMessage, } from "naive-ui";
import { useQueueStore } from "@/stores/queue";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";
const { t } = useI18n();
const message = useMessage();
const queueStore = useQueueStore();
const configStore = useConfigStore();
const subExport = ref("compress");
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
const buildParams = (op) => {
    const p = {};
    if (configStore.config.output_dir)
        p.output_dir = configStore.config.output_dir;
    if (op === "compress") {
        p.codec = compForm.value.codec;
        p.preset = compForm.value.preset;
        p.crf = compForm.value.crf;
    }
    else if (op === "convert") {
        p.format = convForm.value.format;
        p.fast = convForm.value.fast;
    }
    else if (op === "create_gif") {
        p.start = gifForm.value.start;
        p.duration = gifForm.value.duration;
        p.quality = gifForm.value.quality;
    }
    else if (op === "apply_metadata") {
        p.title = metaForm.value.title;
        p.artist = metaForm.value.artist;
        p.comment = metaForm.value.comment;
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
            __VLS_ctx.subExport = 'compress';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subExport === 'compress' }) },
});
(__VLS_ctx.t('sub_export_compress'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subExport = 'convert';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subExport === 'convert' }) },
});
(__VLS_ctx.t('sub_export_convert'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subExport = 'gif';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subExport === 'gif' }) },
});
(__VLS_ctx.t('sub_export_gif'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subExport = 'meta';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subExport === 'meta' }) },
});
(__VLS_ctx.t('sub_export_meta'));
if (__VLS_ctx.subExport === 'compress') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('compress_title'));
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
    (__VLS_ctx.t('video_codec_label'));
    const __VLS_0 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        value: (__VLS_ctx.compForm.codec),
        options: (__VLS_ctx.codecOptions),
    }));
    const __VLS_2 = __VLS_1({
        value: (__VLS_ctx.compForm.codec),
        options: (__VLS_ctx.codecOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('speed_preset_label'));
    const __VLS_4 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        value: (__VLS_ctx.compForm.preset),
        options: (__VLS_ctx.presetOptions),
    }));
    const __VLS_6 = __VLS_5({
        value: (__VLS_ctx.compForm.preset),
        options: (__VLS_ctx.presetOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('crf_level_label'));
    (__VLS_ctx.compForm.crf);
    (__VLS_ctx.t('crf_desc'));
    const __VLS_8 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
        value: (__VLS_ctx.compForm.crf),
        min: (16),
        max: (35),
    }));
    const __VLS_10 = __VLS_9({
        value: (__VLS_ctx.compForm.crf),
        min: (16),
        max: (35),
    }, ...__VLS_functionalComponentArgsRest(__VLS_9));
    const __VLS_12 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        size: (10),
    }));
    const __VLS_14 = __VLS_13({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    __VLS_15.slots.default;
    const __VLS_16 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_18 = __VLS_17({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_17));
    let __VLS_20;
    let __VLS_21;
    let __VLS_22;
    const __VLS_23 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subExport === 'compress'))
                return;
            __VLS_ctx.runOp('compress');
        }
    };
    __VLS_19.slots.default;
    (__VLS_ctx.t('btn_compress_selected'));
    var __VLS_19;
    const __VLS_24 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_26 = __VLS_25({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_25));
    let __VLS_28;
    let __VLS_29;
    let __VLS_30;
    const __VLS_31 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subExport === 'compress'))
                return;
            __VLS_ctx.runBatch('compress');
        }
    };
    __VLS_27.slots.default;
    (__VLS_ctx.t('btn_compress_queue'));
    var __VLS_27;
    var __VLS_15;
}
if (__VLS_ctx.subExport === 'convert') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('convert_title'));
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
    (__VLS_ctx.t('target_container'));
    const __VLS_32 = {}.NSelect;
    /** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        value: (__VLS_ctx.convForm.format),
        options: (__VLS_ctx.containerOptions),
    }));
    const __VLS_34 = __VLS_33({
        value: (__VLS_ctx.convForm.format),
        options: (__VLS_ctx.containerOptions),
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
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
            if (!(__VLS_ctx.subExport === 'convert'))
                return;
            __VLS_ctx.runOp('convert');
        }
    };
    __VLS_43.slots.default;
    (__VLS_ctx.t('btn_convert_selected'));
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
            if (!(__VLS_ctx.subExport === 'convert'))
                return;
            __VLS_ctx.runBatch('convert');
        }
    };
    __VLS_51.slots.default;
    (__VLS_ctx.t('btn_convert_queue'));
    var __VLS_51;
    var __VLS_39;
}
if (__VLS_ctx.subExport === 'gif') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('gif_title'));
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
    (__VLS_ctx.t('gif_start'));
    (__VLS_ctx.gifForm.start);
    (__VLS_ctx.t('sec_unit'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_56 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        value: (__VLS_ctx.gifForm.start),
        min: (0),
        max: (Math.max(30, __VLS_ctx.queueStore.selectedMediaInfo?.duration || 120)),
        step: (0.5),
        ...{ style: {} },
    }));
    const __VLS_58 = __VLS_57({
        value: (__VLS_ctx.gifForm.start),
        min: (0),
        max: (Math.max(30, __VLS_ctx.queueStore.selectedMediaInfo?.duration || 120)),
        step: (0.5),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    const __VLS_60 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        value: (__VLS_ctx.gifForm.start),
        min: (0),
        step: (0.5),
        ...{ style: {} },
    }));
    const __VLS_62 = __VLS_61({
        value: (__VLS_ctx.gifForm.start),
        min: (0),
        step: (0.5),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('gif_duration'));
    (__VLS_ctx.gifForm.duration);
    (__VLS_ctx.t('sec_unit'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_64 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        value: (__VLS_ctx.gifForm.duration),
        min: (1),
        max: (30),
        step: (1),
        ...{ style: {} },
    }));
    const __VLS_66 = __VLS_65({
        value: (__VLS_ctx.gifForm.duration),
        min: (1),
        max: (30),
        step: (1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    const __VLS_68 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
        value: (__VLS_ctx.gifForm.duration),
        min: (1),
        max: (60),
        ...{ style: {} },
    }));
    const __VLS_70 = __VLS_69({
        value: (__VLS_ctx.gifForm.duration),
        min: (1),
        max: (60),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_69));
    const __VLS_72 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_74 = __VLS_73({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    let __VLS_76;
    let __VLS_77;
    let __VLS_78;
    const __VLS_79 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subExport === 'gif'))
                return;
            __VLS_ctx.runOp('create_gif');
        }
    };
    __VLS_75.slots.default;
    (__VLS_ctx.t('btn_gif_file'));
    var __VLS_75;
}
if (__VLS_ctx.subExport === 'meta') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('meta_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('meta_work_title'));
    const __VLS_80 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        value: (__VLS_ctx.metaForm.title),
        placeholder: (__VLS_ctx.t('meta_title_ph')),
    }));
    const __VLS_82 = __VLS_81({
        value: (__VLS_ctx.metaForm.title),
        placeholder: (__VLS_ctx.t('meta_title_ph')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('meta_artist'));
    const __VLS_84 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        value: (__VLS_ctx.metaForm.artist),
        placeholder: (__VLS_ctx.t('meta_artist_ph')),
    }));
    const __VLS_86 = __VLS_85({
        value: (__VLS_ctx.metaForm.artist),
        placeholder: (__VLS_ctx.t('meta_artist_ph')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('meta_comment'));
    const __VLS_88 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        value: (__VLS_ctx.metaForm.comment),
        placeholder: (__VLS_ctx.t('meta_comment_ph')),
    }));
    const __VLS_90 = __VLS_89({
        value: (__VLS_ctx.metaForm.comment),
        placeholder: (__VLS_ctx.t('meta_comment_ph')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    const __VLS_92 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_94 = __VLS_93({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    let __VLS_96;
    let __VLS_97;
    let __VLS_98;
    const __VLS_99 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subExport === 'meta'))
                return;
            __VLS_ctx.runOp('apply_metadata');
        }
    };
    __VLS_95.slots.default;
    (__VLS_ctx.t('btn_meta_file'));
    var __VLS_95;
}
/** @type {__VLS_StyleScopedClasses['studio-subtabs']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-panel']} */ ;
/** @type {__VLS_StyleScopedClasses['panel-header']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid-2']} */ ;
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
            NSelect: NSelect,
            NFlex: NFlex,
            t: t,
            queueStore: queueStore,
            subExport: subExport,
            compForm: compForm,
            convForm: convForm,
            gifForm: gifForm,
            metaForm: metaForm,
            containerOptions: containerOptions,
            codecOptions: codecOptions,
            presetOptions: presetOptions,
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
//# sourceMappingURL=ExportView.vue.js.map
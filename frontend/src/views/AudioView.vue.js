import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NSlider, NInput, NInputNumber, NTag, NFlex, useMessage, } from "naive-ui";
import { useQueueStore } from "@/stores/queue";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";
const { t } = useI18n();
const message = useMessage();
const queueStore = useQueueStore();
const configStore = useConfigStore();
const subAudio = ref("loudnorm");
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
const onLoudnormPresetChange = (preset) => {
    loudnormForm.value.preset = preset;
    if (preset === "-14") {
        loudnormForm.value.i = -14.0;
        loudnormForm.value.tp = -1.0;
        loudnormForm.value.lra = 11.0;
    }
    else if (preset === "-16") {
        loudnormForm.value.i = -16.0;
        loudnormForm.value.tp = -1.5;
        loudnormForm.value.lra = 11.0;
    }
    else if (preset === "-23") {
        loudnormForm.value.i = -23.0;
        loudnormForm.value.tp = -1.0;
        loudnormForm.value.lra = 7.0;
    }
    else if (preset === "-24") {
        loudnormForm.value.i = -24.0;
        loudnormForm.value.tp = -2.0;
        loudnormForm.value.lra = 7.0;
    }
};
const pickAudio = async () => {
    const p = await apiClient.selectAudioFile();
    if (p)
        audioForm.value.path = p;
};
const buildParams = (op) => {
    const p = {};
    if (configStore.config.output_dir)
        p.output_dir = configStore.config.output_dir;
    if (op === "normalize_audio") {
        p.i = loudnormForm.value.i;
        p.tp = loudnormForm.value.tp;
        p.lra = loudnormForm.value.lra;
    }
    else if (op === "remove_silence") {
        p.threshold_db = silenceForm.value.threshold_db;
        p.min_duration = silenceForm.value.min_duration;
    }
    else if (op === "replace_audio") {
        if (!audioForm.value.path) {
            message.error(t("msg_no_audio_file"));
            return null;
        }
        p.audio_file = audioForm.value.path;
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
            __VLS_ctx.subAudio = 'loudnorm';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subAudio === 'loudnorm' }) },
});
(__VLS_ctx.t('sub_audio_loudnorm'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subAudio = 'silence';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subAudio === 'silence' }) },
});
(__VLS_ctx.t('sub_audio_silence'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.subAudio = 'replace';
        } },
    ...{ class: "subtab-btn" },
    ...{ class: ({ 'is-active': __VLS_ctx.subAudio === 'replace' }) },
});
(__VLS_ctx.t('sub_audio_replace'));
if (__VLS_ctx.subAudio === 'loudnorm') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('loudnorm_title'));
    const __VLS_0 = {}.NTag;
    /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        size: "small",
        type: "success",
        round: true,
    }));
    const __VLS_2 = __VLS_1({
        size: "small",
        type: "success",
        round: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    __VLS_3.slots.default;
    (__VLS_ctx.t('loudnorm_target'));
    (__VLS_ctx.loudnormForm.i);
    (__VLS_ctx.loudnormForm.tp);
    var __VLS_3;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('loudnorm_desc'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('loudnorm_presets_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_4 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ 'onClick': {} },
        size: "small",
        secondary: (__VLS_ctx.loudnormForm.preset !== '-14'),
        type: (__VLS_ctx.loudnormForm.preset === '-14' ? 'primary' : 'default'),
    }));
    const __VLS_6 = __VLS_5({
        ...{ 'onClick': {} },
        size: "small",
        secondary: (__VLS_ctx.loudnormForm.preset !== '-14'),
        type: (__VLS_ctx.loudnormForm.preset === '-14' ? 'primary' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    let __VLS_8;
    let __VLS_9;
    let __VLS_10;
    const __VLS_11 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subAudio === 'loudnorm'))
                return;
            __VLS_ctx.onLoudnormPresetChange('-14');
        }
    };
    __VLS_7.slots.default;
    var __VLS_7;
    const __VLS_12 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
        ...{ 'onClick': {} },
        size: "small",
        secondary: (__VLS_ctx.loudnormForm.preset !== '-16'),
        type: (__VLS_ctx.loudnormForm.preset === '-16' ? 'primary' : 'default'),
    }));
    const __VLS_14 = __VLS_13({
        ...{ 'onClick': {} },
        size: "small",
        secondary: (__VLS_ctx.loudnormForm.preset !== '-16'),
        type: (__VLS_ctx.loudnormForm.preset === '-16' ? 'primary' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_13));
    let __VLS_16;
    let __VLS_17;
    let __VLS_18;
    const __VLS_19 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subAudio === 'loudnorm'))
                return;
            __VLS_ctx.onLoudnormPresetChange('-16');
        }
    };
    __VLS_15.slots.default;
    (__VLS_ctx.t('preset_podcast'));
    var __VLS_15;
    const __VLS_20 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
        ...{ 'onClick': {} },
        size: "small",
        secondary: (__VLS_ctx.loudnormForm.preset !== '-23'),
        type: (__VLS_ctx.loudnormForm.preset === '-23' ? 'primary' : 'default'),
    }));
    const __VLS_22 = __VLS_21({
        ...{ 'onClick': {} },
        size: "small",
        secondary: (__VLS_ctx.loudnormForm.preset !== '-23'),
        type: (__VLS_ctx.loudnormForm.preset === '-23' ? 'primary' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_21));
    let __VLS_24;
    let __VLS_25;
    let __VLS_26;
    const __VLS_27 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subAudio === 'loudnorm'))
                return;
            __VLS_ctx.onLoudnormPresetChange('-23');
        }
    };
    __VLS_23.slots.default;
    (__VLS_ctx.t('preset_ebu'));
    var __VLS_23;
    const __VLS_28 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
        ...{ 'onClick': {} },
        size: "small",
        secondary: (__VLS_ctx.loudnormForm.preset !== '-24'),
        type: (__VLS_ctx.loudnormForm.preset === '-24' ? 'primary' : 'default'),
    }));
    const __VLS_30 = __VLS_29({
        ...{ 'onClick': {} },
        size: "small",
        secondary: (__VLS_ctx.loudnormForm.preset !== '-24'),
        type: (__VLS_ctx.loudnormForm.preset === '-24' ? 'primary' : 'default'),
    }, ...__VLS_functionalComponentArgsRest(__VLS_29));
    let __VLS_32;
    let __VLS_33;
    let __VLS_34;
    const __VLS_35 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subAudio === 'loudnorm'))
                return;
            __VLS_ctx.onLoudnormPresetChange('-24');
        }
    };
    __VLS_31.slots.default;
    (__VLS_ctx.t('preset_atsc'));
    var __VLS_31;
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
    (__VLS_ctx.t('loudnorm_i_label'));
    (__VLS_ctx.loudnormForm.i);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_36 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
        value: (__VLS_ctx.loudnormForm.i),
        min: (-35),
        max: (-10),
        step: (0.5),
        ...{ style: {} },
    }));
    const __VLS_38 = __VLS_37({
        value: (__VLS_ctx.loudnormForm.i),
        min: (-35),
        max: (-10),
        step: (0.5),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_37));
    const __VLS_40 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
        value: (__VLS_ctx.loudnormForm.i),
        min: (-70),
        max: (-5),
        step: (0.5),
        ...{ style: {} },
    }));
    const __VLS_42 = __VLS_41({
        value: (__VLS_ctx.loudnormForm.i),
        min: (-70),
        max: (-5),
        step: (0.5),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_41));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('loudnorm_i_desc'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('loudnorm_tp_label'));
    (__VLS_ctx.loudnormForm.tp);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_44 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
        value: (__VLS_ctx.loudnormForm.tp),
        min: (-6),
        max: (0),
        step: (0.1),
        ...{ style: {} },
    }));
    const __VLS_46 = __VLS_45({
        value: (__VLS_ctx.loudnormForm.tp),
        min: (-6),
        max: (0),
        step: (0.1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_45));
    const __VLS_48 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
        value: (__VLS_ctx.loudnormForm.tp),
        min: (-9),
        max: (0),
        step: (0.1),
        ...{ style: {} },
    }));
    const __VLS_50 = __VLS_49({
        value: (__VLS_ctx.loudnormForm.tp),
        min: (-9),
        max: (0),
        step: (0.1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_49));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('loudnorm_tp_desc'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('loudnorm_lra_label'));
    (__VLS_ctx.loudnormForm.lra);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_52 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
        value: (__VLS_ctx.loudnormForm.lra),
        min: (3),
        max: (25),
        step: (0.5),
        ...{ style: {} },
    }));
    const __VLS_54 = __VLS_53({
        value: (__VLS_ctx.loudnormForm.lra),
        min: (3),
        max: (25),
        step: (0.5),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_53));
    const __VLS_56 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_57 = __VLS_asFunctionalComponent(__VLS_56, new __VLS_56({
        value: (__VLS_ctx.loudnormForm.lra),
        min: (1),
        max: (50),
        step: (0.5),
        ...{ style: {} },
    }));
    const __VLS_58 = __VLS_57({
        value: (__VLS_ctx.loudnormForm.lra),
        min: (1),
        max: (50),
        step: (0.5),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_57));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    (__VLS_ctx.t('loudnorm_lra_desc'));
    const __VLS_60 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
        size: (10),
    }));
    const __VLS_62 = __VLS_61({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_61));
    __VLS_63.slots.default;
    const __VLS_64 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_65 = __VLS_asFunctionalComponent(__VLS_64, new __VLS_64({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_66 = __VLS_65({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_65));
    let __VLS_68;
    let __VLS_69;
    let __VLS_70;
    const __VLS_71 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subAudio === 'loudnorm'))
                return;
            __VLS_ctx.runOp('normalize_audio');
        }
    };
    __VLS_67.slots.default;
    (__VLS_ctx.t('btn_norm_file'));
    var __VLS_67;
    const __VLS_72 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_74 = __VLS_73({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_73));
    let __VLS_76;
    let __VLS_77;
    let __VLS_78;
    const __VLS_79 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subAudio === 'loudnorm'))
                return;
            __VLS_ctx.runBatch('normalize_audio');
        }
    };
    __VLS_75.slots.default;
    (__VLS_ctx.t('btn_norm_queue'));
    var __VLS_75;
    var __VLS_63;
}
if (__VLS_ctx.subAudio === 'silence') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('silence_title'));
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
    (__VLS_ctx.t('silence_thresh'));
    (__VLS_ctx.silenceForm.threshold_db);
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_80 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
        value: (__VLS_ctx.silenceForm.threshold_db),
        min: (-60),
        max: (-10),
        step: (1),
        ...{ style: {} },
    }));
    const __VLS_82 = __VLS_81({
        value: (__VLS_ctx.silenceForm.threshold_db),
        min: (-60),
        max: (-10),
        step: (1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_81));
    const __VLS_84 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
        value: (__VLS_ctx.silenceForm.threshold_db),
        min: (-80),
        max: (-5),
        ...{ style: {} },
    }));
    const __VLS_86 = __VLS_85({
        value: (__VLS_ctx.silenceForm.threshold_db),
        min: (-80),
        max: (-5),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_85));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('silence_dur'));
    (__VLS_ctx.silenceForm.min_duration);
    (__VLS_ctx.t('sec_unit'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    const __VLS_88 = {}.NSlider;
    /** @type {[typeof __VLS_components.NSlider, typeof __VLS_components.nSlider, ]} */ ;
    // @ts-ignore
    const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
        value: (__VLS_ctx.silenceForm.min_duration),
        min: (0.2),
        max: (5.0),
        step: (0.1),
        ...{ style: {} },
    }));
    const __VLS_90 = __VLS_89({
        value: (__VLS_ctx.silenceForm.min_duration),
        min: (0.2),
        max: (5.0),
        step: (0.1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_89));
    const __VLS_92 = {}.NInputNumber;
    /** @type {[typeof __VLS_components.NInputNumber, typeof __VLS_components.nInputNumber, ]} */ ;
    // @ts-ignore
    const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
        value: (__VLS_ctx.silenceForm.min_duration),
        min: (0.1),
        max: (30),
        step: (0.1),
        ...{ style: {} },
    }));
    const __VLS_94 = __VLS_93({
        value: (__VLS_ctx.silenceForm.min_duration),
        min: (0.1),
        max: (30),
        step: (0.1),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_93));
    const __VLS_96 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
        size: (10),
    }));
    const __VLS_98 = __VLS_97({
        size: (10),
    }, ...__VLS_functionalComponentArgsRest(__VLS_97));
    __VLS_99.slots.default;
    const __VLS_100 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_102 = __VLS_101({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_101));
    let __VLS_104;
    let __VLS_105;
    let __VLS_106;
    const __VLS_107 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subAudio === 'silence'))
                return;
            __VLS_ctx.runOp('remove_silence');
        }
    };
    __VLS_103.slots.default;
    (__VLS_ctx.t('btn_silence_file'));
    var __VLS_103;
    const __VLS_108 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_110 = __VLS_109({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_109));
    let __VLS_112;
    let __VLS_113;
    let __VLS_114;
    const __VLS_115 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subAudio === 'silence'))
                return;
            __VLS_ctx.runBatch('remove_silence');
        }
    };
    __VLS_111.slots.default;
    (__VLS_ctx.t('btn_silence_queue'));
    var __VLS_111;
    var __VLS_99;
}
if (__VLS_ctx.subAudio === 'replace') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "studio-panel" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "panel-header" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('replace_audio_title'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "form-field" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
        ...{ class: "field-label" },
    });
    (__VLS_ctx.t('new_audio_label'));
    const __VLS_116 = {}.NFlex;
    /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
    // @ts-ignore
    const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
        align: "center",
        size: (8),
    }));
    const __VLS_118 = __VLS_117({
        align: "center",
        size: (8),
    }, ...__VLS_functionalComponentArgsRest(__VLS_117));
    __VLS_119.slots.default;
    const __VLS_120 = {}.NInput;
    /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
    // @ts-ignore
    const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
        value: (__VLS_ctx.audioForm.path),
        placeholder: (__VLS_ctx.t('choose_audio_file')),
        ...{ style: {} },
    }));
    const __VLS_122 = __VLS_121({
        value: (__VLS_ctx.audioForm.path),
        placeholder: (__VLS_ctx.t('choose_audio_file')),
        ...{ style: {} },
    }, ...__VLS_functionalComponentArgsRest(__VLS_121));
    const __VLS_124 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
        ...{ 'onClick': {} },
        secondary: true,
    }));
    const __VLS_126 = __VLS_125({
        ...{ 'onClick': {} },
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_125));
    let __VLS_128;
    let __VLS_129;
    let __VLS_130;
    const __VLS_131 = {
        onClick: (__VLS_ctx.pickAudio)
    };
    __VLS_127.slots.default;
    (__VLS_ctx.t('browse'));
    var __VLS_127;
    var __VLS_119;
    const __VLS_132 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_134 = __VLS_133({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_133));
    let __VLS_136;
    let __VLS_137;
    let __VLS_138;
    const __VLS_139 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.subAudio === 'replace'))
                return;
            __VLS_ctx.runOp('replace_audio');
        }
    };
    __VLS_135.slots.default;
    (__VLS_ctx.t('btn_replace_audio'));
    var __VLS_135;
}
/** @type {__VLS_StyleScopedClasses['studio-subtabs']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['subtab-btn']} */ ;
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
            t: t,
            subAudio: subAudio,
            loudnormForm: loudnormForm,
            silenceForm: silenceForm,
            audioForm: audioForm,
            onLoudnormPresetChange: onLoudnormPresetChange,
            pickAudio: pickAudio,
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
//# sourceMappingURL=AudioView.vue.js.map
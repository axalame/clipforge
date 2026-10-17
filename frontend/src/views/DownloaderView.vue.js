import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { NInput, NButton, NSelect, NSwitch, NCheckbox, NTag, NProgress, NFlex, useMessage, } from "naive-ui";
import { useAppStore } from "@/stores/app";
import { useConfigStore } from "@/stores/config";
import { useTaskStore } from "@/stores/task";
import { apiClient } from "@/api/client";
import { showAppNotification } from "@/utils/notification";
const { t } = useI18n();
const message = useMessage();
const appStore = useAppStore();
const configStore = useConfigStore();
const taskStore = useTaskStore();
const ytSubNav = ref("download");
const ytDownloadType = ref("single");
const ytUrl = ref("");
const isAnalyzing = ref(false);
const ytVideoMeta = ref(null);
const downloadMode = ref("default");
const selectedVideoFormatId = ref("");
const selectedAudioFormatId = ref("");
const ytContainer = ref("mp4");
const ytEnableTrim = ref(false);
const ytTrimStart = ref("00:00:00");
const ytTrimEnd = ref("");
const ytEmbedMeta = ref(true);
const ytEmbedSubs = ref(false);
const ytEmbedThumb = ref(true);
const ytSponsorblock = ref(false);
const historyFilter = ref("all");
const containerOptions = [
    { label: "MP4 (H.264 / AAC)", value: "mp4" },
    { label: "MKV (Matroska Multimedia)", value: "mkv" },
    { label: "WEBM (VP9 / Opus)", value: "webm" },
    { label: "MP3 (Audio Only)", value: "mp3" },
];
const videoFormatSelectOptions = computed(() => {
    if (!ytVideoMeta.value?.video_formats)
        return [];
    return ytVideoMeta.value.video_formats.map((f) => ({
        label: f.label || `${f.resolution || "Unknown"} (${f.ext})`,
        value: f.format_id,
    }));
});
const audioFormatSelectOptions = computed(() => {
    if (!ytVideoMeta.value?.audio_formats)
        return [];
    return ytVideoMeta.value.audio_formats.map((f) => ({
        label: f.label || `${f.format_id} (${f.ext})`,
        value: f.format_id,
    }));
});
const calculatedSizeText = computed(() => {
    if (!ytVideoMeta.value)
        return "—";
    let total = 0;
    if (downloadMode.value === "default" || downloadMode.value === "video_only") {
        const vf = (ytVideoMeta.value.video_formats || []).find((f) => f.format_id === selectedVideoFormatId.value);
        if (vf && vf.size_mb)
            total += vf.size_mb;
    }
    if (downloadMode.value === "default" || downloadMode.value === "audio_only") {
        const af = (ytVideoMeta.value.audio_formats || []).find((f) => f.format_id === selectedAudioFormatId.value);
        if (af && af.size_mb)
            total += af.size_mb;
    }
    return total > 0 ? `${(Math.round(total * 10) / 10).toFixed(1)} MB` : "—";
});
const pendingTasks = computed(() => {
    return taskStore.downloadHistory.filter((i) => i.status === "downloading");
});
const pendingCount = computed(() => pendingTasks.value.length);
const filteredHistory = computed(() => {
    if (historyFilter.value === "all")
        return taskStore.downloadHistory;
    return taskStore.downloadHistory.filter((i) => i.status === historyFilter.value);
});
const historyEmptyTitle = computed(() => {
    if (historyFilter.value === "all")
        return t("history_empty_all");
    if (historyFilter.value === "completed")
        return t("empty_tasks");
    if (historyFilter.value === "downloading")
        return t("no_active_tasks");
    if (historyFilter.value === "cancelled")
        return t("no_cancelled_tasks");
    if (historyFilter.value === "failed")
        return t("no_failed_tasks");
    return t("history_empty_filter");
});
const formatViews = (n) => {
    if (!n)
        return appStore.currentLang === "en" ? "0 views" : "0 просмотров";
    if (appStore.currentLang === "en") {
        if (n >= 1000000)
            return (n / 1000000).toFixed(1) + "M views";
        if (n >= 1000)
            return (n / 1000).toFixed(1) + "K views";
        return n + " views";
    }
    if (n >= 1000000)
        return (n / 1000000).toFixed(1) + " млн. просмотров";
    if (n >= 1000)
        return (n / 1000).toFixed(1) + " тыс. просмотров";
    return n + " просмотров";
};
const handlePickCookies = async () => {
    const f = await apiClient.pickFile();
    if (f) {
        configStore.config.cookies_file = f;
        await apiClient.saveConfig({ cookies_file: f });
        message.success(t("msg_cookies_saved"));
    }
};
const handlePickOutputDir = async () => {
    const d = await apiClient.pickFolder();
    if (d) {
        configStore.config.output_dir = d;
    }
};
const handlePasteUrl = async () => {
    try {
        const text = await navigator.clipboard.readText();
        if (text && text.trim().startsWith("http")) {
            ytUrl.value = text.trim();
            message.success(t("msg_url_pasted"));
            handleAnalyze();
        }
        else if (text) {
            ytUrl.value = text.trim();
        }
    }
    catch {
        message.info(t("msg_paste_hint"));
    }
};
const resetAnalysis = () => {
    ytVideoMeta.value = null;
    ytUrl.value = "";
    ytEnableTrim.value = false;
};
const handleAnalyze = async () => {
    const targetUrl = ytUrl.value.trim();
    if (!targetUrl) {
        message.warning(t("msg_enter_url"));
        return;
    }
    isAnalyzing.value = true;
    try {
        const res = await apiClient.analyzeUrl({
            url: targetUrl,
            cookie_file: configStore.config.cookies_file,
        });
        if (res && res.ok) {
            ytVideoMeta.value = res;
            if (res.video_formats && res.video_formats.length > 0) {
                selectedVideoFormatId.value = res.video_formats[0].format_id;
            }
            if (res.audio_formats && res.audio_formats.length > 0) {
                selectedAudioFormatId.value = res.audio_formats[0].format_id;
            }
            ytTrimStart.value = "00:00:00";
            ytTrimEnd.value = res.duration || "";
            ytEnableTrim.value = false;
            message.success(t("msg_analyze_success"));
        }
        else {
            const err = res?.error || t("err_fetch_formats");
            message.error(err);
        }
    }
    catch (err) {
        message.error(t("msg_analyze_fail") + err);
    }
    finally {
        isAnalyzing.value = false;
    }
};
const handleDownload = async () => {
    const targetUrl = ytUrl.value.trim();
    if (!targetUrl) {
        message.warning(t("msg_enter_url"));
        return;
    }
    let formatId = "";
    if (downloadMode.value === "default") {
        if (selectedVideoFormatId.value && selectedAudioFormatId.value) {
            formatId = `${selectedVideoFormatId.value}+${selectedAudioFormatId.value}`;
        }
        else if (selectedVideoFormatId.value) {
            formatId = selectedVideoFormatId.value;
        }
    }
    else if (downloadMode.value === "video_only") {
        formatId = selectedVideoFormatId.value;
    }
    else if (downloadMode.value === "audio_only") {
        formatId = selectedAudioFormatId.value;
    }
    let selectedHeight = 0;
    if (selectedVideoFormatId.value && ytVideoMeta.value?.video_formats) {
        const vf = ytVideoMeta.value.video_formats.find((f) => f.format_id === selectedVideoFormatId.value);
        if (vf && vf.height) {
            selectedHeight = vf.height;
        }
    }
    const params = {
        url: targetUrl,
        format_id: formatId || undefined,
        height: selectedHeight > 0 ? selectedHeight : undefined,
        extract_audio: downloadMode.value === "audio_only",
        format: ytContainer.value || "mp4",
        start_time: ytEnableTrim.value ? ytTrimStart.value.trim() : "",
        end_time: ytEnableTrim.value ? ytTrimEnd.value.trim() : "",
        cookie_file: configStore.config.cookies_file,
        output_dir: configStore.config.output_dir || undefined,
        embed_subs: ytEmbedSubs.value,
        embed_thumbnail: ytEmbedThumb.value,
        embed_metadata: ytEmbedMeta.value,
        sponsorblock: ytSponsorblock.value,
    };
    const historyId = Date.now() + "_" + Math.random().toString(36).substring(2, 7);
    const newItem = {
        id: historyId,
        url: targetUrl,
        title: ytVideoMeta.value?.title || targetUrl,
        thumbnail: ytVideoMeta.value?.thumbnail || "",
        duration: ytVideoMeta.value?.duration || "",
        resolution: downloadMode.value === "audio_only" ? "Audio" : (ytVideoMeta.value?.resolution || "1080p"),
        container: ytContainer.value || "mp4",
        status: "downloading",
        progress: 5,
        speed: "",
        eta: "",
        date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        outputPath: "",
    };
    taskStore.addHistoryItem(newItem);
    taskStore.terminalLogs = "";
    await apiClient.downloadUrl(params);
};
const cancelTask = async () => {
    const activeItem = taskStore.downloadHistory.find((item) => item.status === "downloading");
    if (activeItem) {
        activeItem.status = "cancelled";
        taskStore.saveHistory();
    }
    await apiClient.cancel();
    showAppNotification("warning", t("notify_download_cancelled") || "Загрузка отменена", t("notify_download_cancelled_desc") || "Загрузка видео остановлена");
};
const copyToClipboard = async (text) => {
    if (!text)
        return;
    try {
        await navigator.clipboard.writeText(text);
        message.success(t("msg_copied"));
    }
    catch {
        message.info(text);
    }
};
const openHistoryFile = (item) => {
    if (item.outputPath) {
        apiClient.openPath(item.outputPath);
    }
};
const openHistoryFolder = (item) => {
    if (item.outputPath) {
        apiClient.openPath(item.outputPath);
    }
    else if (configStore.config.output_dir) {
        apiClient.openPath(configStore.config.output_dir);
    }
};
const removeHistoryItem = async (item) => {
    const targetPath = item.outputPath || (configStore.config.output_dir ? `${configStore.config.output_dir}/${item.title}.${item.container || 'mp4'}` : "");
    if (targetPath) {
        try {
            await apiClient.deleteFile(targetPath);
        }
        catch (e) {
            console.warn("Failed to delete file from disk:", e);
        }
    }
    taskStore.downloadHistory = taskStore.downloadHistory.filter((i) => i.id !== item.id);
    taskStore.saveHistory();
    message.success(t("msg_deleted_history_file") || "Файл и запись удалены");
};
const clearHistory = () => {
    taskStore.clearHistory();
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "yt-nav-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "yt-header-tabs" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.ytSubNav = 'download';
        } },
    ...{ class: "yt-header-tab" },
    ...{ class: ({ 'is-active': __VLS_ctx.ytSubNav === 'download' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
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
(__VLS_ctx.t('tab_download'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.ytSubNav = 'pending';
        } },
    ...{ class: "yt-header-tab" },
    ...{ class: ({ 'is-active': __VLS_ctx.ytSubNav === 'pending' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
    cx: "12",
    cy: "12",
    r: "10",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "12 6 12 12 16 14",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('tab_pending'));
if (__VLS_ctx.pendingCount > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "tab-badge" },
    });
    (__VLS_ctx.pendingCount);
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ onClick: (...[$event]) => {
            __VLS_ctx.ytSubNav = 'history';
        } },
    ...{ class: "yt-header-tab" },
    ...{ class: ({ 'is-active': __VLS_ctx.ytSubNav === 'history' }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "14",
    height: "14",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "14 2 14 8 20 8",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "16",
    y1: "13",
    x2: "8",
    y2: "13",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "16",
    y1: "17",
    x2: "8",
    y2: "17",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "10 9 9 9 8 9",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('tab_history'));
if (__VLS_ctx.taskStore.downloadHistory.length > 0) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "tab-badge" },
    });
    (__VLS_ctx.taskStore.downloadHistory.length);
}
if (__VLS_ctx.ytSubNav === 'download') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (!__VLS_ctx.ytVideoMeta) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-welcome-container" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-welcome-title" },
        });
        (__VLS_ctx.t('welcome_title'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-mode-pills" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.ytSubNav === 'download'))
                        return;
                    if (!(!__VLS_ctx.ytVideoMeta))
                        return;
                    __VLS_ctx.ytDownloadType = 'single';
                } },
            ...{ class: "yt-pill" },
            ...{ class: ({ 'is-active': __VLS_ctx.ytDownloadType === 'single' }) },
        });
        (__VLS_ctx.t('mode_single'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.ytSubNav === 'download'))
                        return;
                    if (!(!__VLS_ctx.ytVideoMeta))
                        return;
                    __VLS_ctx.ytDownloadType = 'batch';
                } },
            ...{ class: "yt-pill" },
            ...{ class: ({ 'is-active': __VLS_ctx.ytDownloadType === 'batch' }) },
        });
        (__VLS_ctx.t('mode_batch'));
        if (__VLS_ctx.ytDownloadType === 'single') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "yt-search-box" },
            });
            const __VLS_0 = {}.NInput;
            /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
            // @ts-ignore
            const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
                ...{ 'onKeydown': {} },
                value: (__VLS_ctx.ytUrl),
                placeholder: (__VLS_ctx.t('placeholder_url')),
                size: "large",
                round: true,
                clearable: true,
                ...{ class: "yt-pill-input" },
            }));
            const __VLS_2 = __VLS_1({
                ...{ 'onKeydown': {} },
                value: (__VLS_ctx.ytUrl),
                placeholder: (__VLS_ctx.t('placeholder_url')),
                size: "large",
                round: true,
                clearable: true,
                ...{ class: "yt-pill-input" },
            }, ...__VLS_functionalComponentArgsRest(__VLS_1));
            let __VLS_4;
            let __VLS_5;
            let __VLS_6;
            const __VLS_7 = {
                onKeydown: (__VLS_ctx.handleAnalyze)
            };
            __VLS_3.slots.default;
            {
                const { prefix: __VLS_thisSlot } = __VLS_3.slots;
                __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                    viewBox: "0 0 24 24",
                    width: "16",
                    height: "16",
                    stroke: "currentColor",
                    'stroke-width': "2",
                    fill: "none",
                    ...{ style: {} },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
                    cx: "12",
                    cy: "12",
                    r: "10",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.line, __VLS_intrinsicElements.line)({
                    x1: "2",
                    y1: "12",
                    x2: "22",
                    y2: "12",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
                    d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
                });
            }
            var __VLS_3;
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "yt-search-box" },
            });
            const __VLS_8 = {}.NInput;
            /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
            // @ts-ignore
            const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
                value: (__VLS_ctx.ytUrl),
                type: "textarea",
                placeholder: (__VLS_ctx.t('placeholder_batch')),
                rows: (4),
                ...{ style: {} },
            }));
            const __VLS_10 = __VLS_9({
                value: (__VLS_ctx.ytUrl),
                type: "textarea",
                placeholder: (__VLS_ctx.t('placeholder_batch')),
                rows: (4),
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_9));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-quick-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-quick-left" },
        });
        const __VLS_12 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            ...{ 'onClick': {} },
            secondary: true,
            round: true,
            size: "small",
            title: (__VLS_ctx.t('select_cookies')),
        }));
        const __VLS_14 = __VLS_13({
            ...{ 'onClick': {} },
            secondary: true,
            round: true,
            size: "small",
            title: (__VLS_ctx.t('select_cookies')),
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        let __VLS_16;
        let __VLS_17;
        let __VLS_18;
        const __VLS_19 = {
            onClick: (__VLS_ctx.handlePickCookies)
        };
        __VLS_15.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_15.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "14",
                height: "14",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
                cx: "12",
                cy: "12",
                r: "10",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
                d: "M12 8v4l3 3",
            });
        }
        (__VLS_ctx.configStore.config.cookies_file ? __VLS_ctx.t('cookies_connected') : __VLS_ctx.t('cookies_not_set'));
        var __VLS_15;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-quick-right" },
        });
        const __VLS_20 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            ...{ 'onClick': {} },
            type: "primary",
            round: true,
            size: "medium",
            loading: (__VLS_ctx.isAnalyzing),
            ...{ style: {} },
        }));
        const __VLS_22 = __VLS_21({
            ...{ 'onClick': {} },
            type: "primary",
            round: true,
            size: "medium",
            loading: (__VLS_ctx.isAnalyzing),
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        let __VLS_24;
        let __VLS_25;
        let __VLS_26;
        const __VLS_27 = {
            onClick: (__VLS_ctx.handleAnalyze)
        };
        __VLS_23.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_23.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "15",
                height: "15",
                stroke: "currentColor",
                'stroke-width': "2.2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
                cx: "11",
                cy: "11",
                r: "8",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.line, __VLS_intrinsicElements.line)({
                x1: "21",
                y1: "21",
                x2: "16.65",
                y2: "16.65",
            });
        }
        (__VLS_ctx.t('analyze'));
        var __VLS_23;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-center-tools" },
        });
        const __VLS_28 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            ...{ 'onClick': {} },
            secondary: true,
            round: true,
            size: "medium",
        }));
        const __VLS_30 = __VLS_29({
            ...{ 'onClick': {} },
            secondary: true,
            round: true,
            size: "medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        let __VLS_32;
        let __VLS_33;
        let __VLS_34;
        const __VLS_35 = {
            onClick: (__VLS_ctx.handlePasteUrl)
        };
        __VLS_31.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_31.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "15",
                height: "15",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
                d: "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.rect, __VLS_intrinsicElements.rect)({
                x: "8",
                y: "2",
                width: "8",
                height: "4",
                rx: "1",
                ry: "1",
            });
        }
        (__VLS_ctx.t('paste'));
        var __VLS_31;
        const __VLS_36 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_37 = __VLS_asFunctionalComponent(__VLS_36, new __VLS_36({
            ...{ 'onClick': {} },
            secondary: true,
            round: true,
            size: "medium",
        }));
        const __VLS_38 = __VLS_37({
            ...{ 'onClick': {} },
            secondary: true,
            round: true,
            size: "medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_37));
        let __VLS_40;
        let __VLS_41;
        let __VLS_42;
        const __VLS_43 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.ytSubNav === 'download'))
                    return;
                if (!(!__VLS_ctx.ytVideoMeta))
                    return;
                __VLS_ctx.appStore.activeNav = 'settings';
            }
        };
        __VLS_39.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_39.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "15",
                height: "15",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
                cx: "12",
                cy: "12",
                r: "3",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                d: "M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
            });
        }
        (__VLS_ctx.t('nav_settings'));
        var __VLS_39;
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-analyzed-container" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-url-bar" },
        });
        const __VLS_44 = {}.NInput;
        /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
        // @ts-ignore
        const __VLS_45 = __VLS_asFunctionalComponent(__VLS_44, new __VLS_44({
            ...{ 'onKeydown': {} },
            value: (__VLS_ctx.ytUrl),
            placeholder: "URL",
            round: true,
            size: "medium",
        }));
        const __VLS_46 = __VLS_45({
            ...{ 'onKeydown': {} },
            value: (__VLS_ctx.ytUrl),
            placeholder: "URL",
            round: true,
            size: "medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_45));
        let __VLS_48;
        let __VLS_49;
        let __VLS_50;
        const __VLS_51 = {
            onKeydown: (__VLS_ctx.handleAnalyze)
        };
        __VLS_47.slots.default;
        {
            const { suffix: __VLS_thisSlot } = __VLS_47.slots;
            const __VLS_52 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
                ...{ 'onClick': {} },
                quaternary: true,
                circle: true,
                size: "small",
                loading: (__VLS_ctx.isAnalyzing),
                title: (__VLS_ctx.t('refresh')),
            }));
            const __VLS_54 = __VLS_53({
                ...{ 'onClick': {} },
                quaternary: true,
                circle: true,
                size: "small",
                loading: (__VLS_ctx.isAnalyzing),
                title: (__VLS_ctx.t('refresh')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_53));
            let __VLS_56;
            let __VLS_57;
            let __VLS_58;
            const __VLS_59 = {
                onClick: (__VLS_ctx.handleAnalyze)
            };
            __VLS_55.slots.default;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "14",
                height: "14",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline, __VLS_intrinsicElements.polyline)({
                points: "23 4 23 10 17 10",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline, __VLS_intrinsicElements.polyline)({
                points: "1 20 1 14 7 14",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
                d: "M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
            });
            var __VLS_55;
        }
        var __VLS_47;
        const __VLS_60 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
            ...{ 'onClick': {} },
            secondary: true,
            round: true,
            size: "medium",
        }));
        const __VLS_62 = __VLS_61({
            ...{ 'onClick': {} },
            secondary: true,
            round: true,
            size: "medium",
        }, ...__VLS_functionalComponentArgsRest(__VLS_61));
        let __VLS_64;
        let __VLS_65;
        let __VLS_66;
        const __VLS_67 = {
            onClick: (__VLS_ctx.resetAnalysis)
        };
        __VLS_63.slots.default;
        (__VLS_ctx.t('new_url'));
        var __VLS_63;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-card yt-meta-header" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-thumb-wrapper" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (__VLS_ctx.ytVideoMeta.thumbnail),
            ...{ class: "yt-thumb-img" },
            alt: "Thumbnail",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "yt-duration-badge" },
        });
        (__VLS_ctx.ytVideoMeta.duration || '00:00');
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-meta-info" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-video-title" },
            title: (__VLS_ctx.ytVideoMeta.title),
        });
        (__VLS_ctx.ytVideoMeta.title);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-channel-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "14",
            height: "14",
            stroke: "currentColor",
            'stroke-width': "2",
            fill: "none",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
            d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
            cx: "12",
            cy: "7",
            r: "4",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.ytVideoMeta.uploader || __VLS_ctx.t('channel_unknown'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-views-row" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "14",
            height: "14",
            stroke: "currentColor",
            'stroke-width': "2",
            fill: "none",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
            d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
            cx: "12",
            cy: "12",
            r: "3",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.formatViews(__VLS_ctx.ytVideoMeta.view_count));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-section-label" },
        });
        (__VLS_ctx.t('download_method'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-mode-selector" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.ytSubNav === 'download'))
                        return;
                    if (!!(!__VLS_ctx.ytVideoMeta))
                        return;
                    __VLS_ctx.downloadMode = 'default';
                } },
            ...{ class: "yt-mode-btn" },
            ...{ class: ({ 'is-selected': __VLS_ctx.downloadMode === 'default' }) },
        });
        (__VLS_ctx.t('method_default'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.ytSubNav === 'download'))
                        return;
                    if (!!(!__VLS_ctx.ytVideoMeta))
                        return;
                    __VLS_ctx.downloadMode = 'video_only';
                } },
            ...{ class: "yt-mode-btn" },
            ...{ class: ({ 'is-selected': __VLS_ctx.downloadMode === 'video_only' }) },
        });
        (__VLS_ctx.t('method_video_only'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.ytSubNav === 'download'))
                        return;
                    if (!!(!__VLS_ctx.ytVideoMeta))
                        return;
                    __VLS_ctx.downloadMode = 'audio_only';
                } },
            ...{ class: "yt-mode-btn" },
            ...{ class: ({ 'is-selected': __VLS_ctx.downloadMode === 'audio_only' }) },
        });
        (__VLS_ctx.t('method_audio_only'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        if (__VLS_ctx.downloadMode === 'default' || __VLS_ctx.downloadMode === 'video_only') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "form-field" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "field-label" },
            });
            (__VLS_ctx.t('label_video'));
            const __VLS_68 = {}.NSelect;
            /** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
            // @ts-ignore
            const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
                value: (__VLS_ctx.selectedVideoFormatId),
                options: (__VLS_ctx.videoFormatSelectOptions),
                placeholder: (__VLS_ctx.t('placeholder_video')),
            }));
            const __VLS_70 = __VLS_69({
                value: (__VLS_ctx.selectedVideoFormatId),
                options: (__VLS_ctx.videoFormatSelectOptions),
                placeholder: (__VLS_ctx.t('placeholder_video')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_69));
        }
        if (__VLS_ctx.downloadMode === 'default' || __VLS_ctx.downloadMode === 'audio_only') {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "form-field" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
                ...{ class: "field-label" },
            });
            (__VLS_ctx.t('label_audio'));
            const __VLS_72 = {}.NSelect;
            /** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
            // @ts-ignore
            const __VLS_73 = __VLS_asFunctionalComponent(__VLS_72, new __VLS_72({
                value: (__VLS_ctx.selectedAudioFormatId),
                options: (__VLS_ctx.audioFormatSelectOptions),
                placeholder: (__VLS_ctx.t('placeholder_audio')),
            }));
            const __VLS_74 = __VLS_73({
                value: (__VLS_ctx.selectedAudioFormatId),
                options: (__VLS_ctx.audioFormatSelectOptions),
                placeholder: (__VLS_ctx.t('placeholder_audio')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_73));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-section-label" },
        });
        (__VLS_ctx.t('extra_params'));
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
        (__VLS_ctx.t('file_container'));
        const __VLS_76 = {}.NSelect;
        /** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
        // @ts-ignore
        const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
            value: (__VLS_ctx.ytContainer),
            options: (__VLS_ctx.containerOptions),
        }));
        const __VLS_78 = __VLS_77({
            value: (__VLS_ctx.ytContainer),
            options: (__VLS_ctx.containerOptions),
        }, ...__VLS_functionalComponentArgsRest(__VLS_77));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "form-field" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({
            ...{ class: "field-label" },
            ...{ style: {} },
        });
        (__VLS_ctx.t('time_trim'));
        const __VLS_80 = {}.NSwitch;
        /** @type {[typeof __VLS_components.NSwitch, typeof __VLS_components.nSwitch, typeof __VLS_components.NSwitch, typeof __VLS_components.nSwitch, ]} */ ;
        // @ts-ignore
        const __VLS_81 = __VLS_asFunctionalComponent(__VLS_80, new __VLS_80({
            value: (__VLS_ctx.ytEnableTrim),
            size: "small",
        }));
        const __VLS_82 = __VLS_81({
            value: (__VLS_ctx.ytEnableTrim),
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_81));
        __VLS_83.slots.default;
        {
            const { checked: __VLS_thisSlot } = __VLS_83.slots;
            (__VLS_ctx.t('trim_fragment'));
        }
        {
            const { unchecked: __VLS_thisSlot } = __VLS_83.slots;
            (__VLS_ctx.t('trim_full'));
        }
        var __VLS_83;
        if (__VLS_ctx.ytEnableTrim) {
            const __VLS_84 = {}.NFlex;
            /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
            // @ts-ignore
            const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
                size: (6),
                align: "center",
            }));
            const __VLS_86 = __VLS_85({
                size: (6),
                align: "center",
            }, ...__VLS_functionalComponentArgsRest(__VLS_85));
            __VLS_87.slots.default;
            const __VLS_88 = {}.NInput;
            /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
            // @ts-ignore
            const __VLS_89 = __VLS_asFunctionalComponent(__VLS_88, new __VLS_88({
                value: (__VLS_ctx.ytTrimStart),
                placeholder: "00:00:00",
                ...{ style: {} },
            }));
            const __VLS_90 = __VLS_89({
                value: (__VLS_ctx.ytTrimStart),
                placeholder: "00:00:00",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_89));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ style: {} },
            });
            const __VLS_92 = {}.NInput;
            /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
            // @ts-ignore
            const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
                value: (__VLS_ctx.ytTrimEnd),
                placeholder: "00:00:00",
                ...{ style: {} },
            }));
            const __VLS_94 = __VLS_93({
                value: (__VLS_ctx.ytTrimEnd),
                placeholder: "00:00:00",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_93));
            var __VLS_87;
        }
        else {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "13",
                height: "13",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
                'stroke-linecap': "round",
                'stroke-linejoin': "round",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
                points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (__VLS_ctx.t('direct_stream_tip'));
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-checkbox-grid" },
        });
        const __VLS_96 = {}.NCheckbox;
        /** @type {[typeof __VLS_components.NCheckbox, typeof __VLS_components.nCheckbox, typeof __VLS_components.NCheckbox, typeof __VLS_components.nCheckbox, ]} */ ;
        // @ts-ignore
        const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
            checked: (__VLS_ctx.ytEmbedMeta),
        }));
        const __VLS_98 = __VLS_97({
            checked: (__VLS_ctx.ytEmbedMeta),
        }, ...__VLS_functionalComponentArgsRest(__VLS_97));
        __VLS_99.slots.default;
        (__VLS_ctx.t('embed_meta'));
        var __VLS_99;
        const __VLS_100 = {}.NCheckbox;
        /** @type {[typeof __VLS_components.NCheckbox, typeof __VLS_components.nCheckbox, typeof __VLS_components.NCheckbox, typeof __VLS_components.nCheckbox, ]} */ ;
        // @ts-ignore
        const __VLS_101 = __VLS_asFunctionalComponent(__VLS_100, new __VLS_100({
            checked: (__VLS_ctx.ytEmbedSubs),
        }));
        const __VLS_102 = __VLS_101({
            checked: (__VLS_ctx.ytEmbedSubs),
        }, ...__VLS_functionalComponentArgsRest(__VLS_101));
        __VLS_103.slots.default;
        (__VLS_ctx.t('embed_subs'));
        var __VLS_103;
        const __VLS_104 = {}.NCheckbox;
        /** @type {[typeof __VLS_components.NCheckbox, typeof __VLS_components.nCheckbox, typeof __VLS_components.NCheckbox, typeof __VLS_components.nCheckbox, ]} */ ;
        // @ts-ignore
        const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
            checked: (__VLS_ctx.ytEmbedThumb),
        }));
        const __VLS_106 = __VLS_105({
            checked: (__VLS_ctx.ytEmbedThumb),
        }, ...__VLS_functionalComponentArgsRest(__VLS_105));
        __VLS_107.slots.default;
        (__VLS_ctx.t('embed_thumb'));
        var __VLS_107;
        const __VLS_108 = {}.NCheckbox;
        /** @type {[typeof __VLS_components.NCheckbox, typeof __VLS_components.nCheckbox, typeof __VLS_components.NCheckbox, typeof __VLS_components.nCheckbox, ]} */ ;
        // @ts-ignore
        const __VLS_109 = __VLS_asFunctionalComponent(__VLS_108, new __VLS_108({
            checked: (__VLS_ctx.ytSponsorblock),
        }));
        const __VLS_110 = __VLS_109({
            checked: (__VLS_ctx.ytSponsorblock),
        }, ...__VLS_functionalComponentArgsRest(__VLS_109));
        __VLS_111.slots.default;
        (__VLS_ctx.t('sponsorblock'));
        var __VLS_111;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('auth_cookies'));
        const __VLS_112 = {}.NTag;
        /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
        // @ts-ignore
        const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
            size: "tiny",
            type: (__VLS_ctx.configStore.config.cookies_file ? 'success' : 'default'),
        }));
        const __VLS_114 = __VLS_113({
            size: "tiny",
            type: (__VLS_ctx.configStore.config.cookies_file ? 'success' : 'default'),
        }, ...__VLS_functionalComponentArgsRest(__VLS_113));
        __VLS_115.slots.default;
        (__VLS_ctx.configStore.config.cookies_file ? __VLS_ctx.t('cookies_file_ok') : __VLS_ctx.t('cookies_not_specified'));
        var __VLS_115;
        const __VLS_116 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_117 = __VLS_asFunctionalComponent(__VLS_116, new __VLS_116({
            ...{ 'onClick': {} },
            size: "tiny",
            secondary: true,
        }));
        const __VLS_118 = __VLS_117({
            ...{ 'onClick': {} },
            size: "tiny",
            secondary: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_117));
        let __VLS_120;
        let __VLS_121;
        let __VLS_122;
        const __VLS_123 = {
            onClick: (...[$event]) => {
                if (!(__VLS_ctx.ytSubNav === 'download'))
                    return;
                if (!!(!__VLS_ctx.ytVideoMeta))
                    return;
                __VLS_ctx.appStore.activeNav = 'settings';
            }
        };
        __VLS_119.slots.default;
        (__VLS_ctx.t('change_in_settings'));
        var __VLS_119;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-card" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-section-label" },
        });
        (__VLS_ctx.t('download_folder'));
        const __VLS_124 = {}.NFlex;
        /** @type {[typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, typeof __VLS_components.NFlex, typeof __VLS_components.nFlex, ]} */ ;
        // @ts-ignore
        const __VLS_125 = __VLS_asFunctionalComponent(__VLS_124, new __VLS_124({
            align: "center",
            size: (8),
        }));
        const __VLS_126 = __VLS_125({
            align: "center",
            size: (8),
        }, ...__VLS_functionalComponentArgsRest(__VLS_125));
        __VLS_127.slots.default;
        const __VLS_128 = {}.NInput;
        /** @type {[typeof __VLS_components.NInput, typeof __VLS_components.nInput, ]} */ ;
        // @ts-ignore
        const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
            value: (__VLS_ctx.configStore.config.output_dir),
            placeholder: "downloads",
            ...{ style: {} },
        }));
        const __VLS_130 = __VLS_129({
            value: (__VLS_ctx.configStore.config.output_dir),
            placeholder: "downloads",
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_129));
        const __VLS_132 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
            ...{ 'onClick': {} },
            secondary: true,
        }));
        const __VLS_134 = __VLS_133({
            ...{ 'onClick': {} },
            secondary: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_133));
        let __VLS_136;
        let __VLS_137;
        let __VLS_138;
        const __VLS_139 = {
            onClick: (__VLS_ctx.handlePickOutputDir)
        };
        __VLS_135.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_135.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "14",
                height: "14",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
                d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
            });
        }
        (__VLS_ctx.t('browse'));
        var __VLS_135;
        var __VLS_127;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-bottom-bar" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "yt-size-label" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "16",
            height: "16",
            stroke: "currentColor",
            'stroke-width': "2",
            fill: "none",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
            d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline, __VLS_intrinsicElements.polyline)({
            points: "14 2 14 8 20 8",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.t('approx_size'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (__VLS_ctx.calculatedSizeText);
        const __VLS_140 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
            ...{ 'onClick': {} },
            type: "primary",
            size: "large",
            loading: (__VLS_ctx.taskStore.isRunning),
            ...{ class: "yt-download-btn" },
        }));
        const __VLS_142 = __VLS_141({
            ...{ 'onClick': {} },
            type: "primary",
            size: "large",
            loading: (__VLS_ctx.taskStore.isRunning),
            ...{ class: "yt-download-btn" },
        }, ...__VLS_functionalComponentArgsRest(__VLS_141));
        let __VLS_144;
        let __VLS_145;
        let __VLS_146;
        const __VLS_147 = {
            onClick: (__VLS_ctx.handleDownload)
        };
        __VLS_143.slots.default;
        {
            const { icon: __VLS_thisSlot } = __VLS_143.slots;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "18",
                height: "18",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
                d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline, __VLS_intrinsicElements.polyline)({
                points: "7 10 12 15 17 10",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.line, __VLS_intrinsicElements.line)({
                x1: "12",
                y1: "15",
                x2: "12",
                y2: "3",
            });
        }
        (__VLS_ctx.t('download_now'));
        var __VLS_143;
    }
}
else if (__VLS_ctx.ytSubNav === 'pending') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    if (__VLS_ctx.pendingTasks.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "history-empty-view" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-icon-box" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "30",
            height: "30",
            stroke: "currentColor",
            'stroke-width': "1.8",
            fill: "none",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.circle, __VLS_intrinsicElements.circle)({
            cx: "12",
            cy: "12",
            r: "10",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline, __VLS_intrinsicElements.polyline)({
            points: "12 6 12 12 16 14",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-label" },
        });
        (__VLS_ctx.t('no_active_tasks'));
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        (__VLS_ctx.t('empty_tasks_sub'));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "history-list" },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.pendingTasks))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (item.id),
                ...{ class: "history-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: {} },
            });
            if (item.thumbnail) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    src: (item.thumbnail),
                    ...{ class: "history-thumb" },
                    ...{ style: {} },
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ style: {} },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                    viewBox: "0 0 24 24",
                    width: "20",
                    height: "20",
                    stroke: "currentColor",
                    'stroke-width': "2",
                    fill: "none",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
                    points: "5 3 19 12 5 21 5 3",
                });
            }
            if (item.duration) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ style: {} },
                });
                (item.duration);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-info" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-title" },
                title: (item.title),
            });
            (item.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-meta" },
            });
            const __VLS_148 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
            // @ts-ignore
            const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
                size: "tiny",
                type: "warning",
            }));
            const __VLS_150 = __VLS_149({
                size: "tiny",
                type: "warning",
            }, ...__VLS_functionalComponentArgsRest(__VLS_149));
            __VLS_151.slots.default;
            (__VLS_ctx.t('status_downloading'));
            (item.progress);
            var __VLS_151;
            if (item.speed) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (item.speed);
            }
            if (item.eta) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (item.eta);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (item.resolution);
            ((item.container || 'MP4').toUpperCase());
            const __VLS_152 = {}.NProgress;
            /** @type {[typeof __VLS_components.NProgress, typeof __VLS_components.nProgress, ]} */ ;
            // @ts-ignore
            const __VLS_153 = __VLS_asFunctionalComponent(__VLS_152, new __VLS_152({
                type: "line",
                percentage: (item.progress),
                processing: true,
                status: "success",
                ...{ style: {} },
            }));
            const __VLS_154 = __VLS_153({
                type: "line",
                percentage: (item.progress),
                processing: true,
                status: "success",
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_153));
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-actions" },
            });
            const __VLS_156 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
                ...{ 'onClick': {} },
                size: "small",
                type: "error",
                secondary: true,
            }));
            const __VLS_158 = __VLS_157({
                ...{ 'onClick': {} },
                size: "small",
                type: "error",
                secondary: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_157));
            let __VLS_160;
            let __VLS_161;
            let __VLS_162;
            const __VLS_163 = {
                onClick: (__VLS_ctx.cancelTask)
            };
            __VLS_159.slots.default;
            (__VLS_ctx.t('stop'));
            var __VLS_159;
            const __VLS_164 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
                ...{ 'onClick': {} },
                size: "tiny",
                quaternary: true,
                circle: true,
                title: (__VLS_ctx.t('copy_link')),
            }));
            const __VLS_166 = __VLS_165({
                ...{ 'onClick': {} },
                size: "tiny",
                quaternary: true,
                circle: true,
                title: (__VLS_ctx.t('copy_link')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_165));
            let __VLS_168;
            let __VLS_169;
            let __VLS_170;
            const __VLS_171 = {
                onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.ytSubNav === 'download'))
                        return;
                    if (!(__VLS_ctx.ytSubNav === 'pending'))
                        return;
                    if (!!(__VLS_ctx.pendingTasks.length === 0))
                        return;
                    __VLS_ctx.copyToClipboard(item.url);
                }
            };
            __VLS_167.slots.default;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "13",
                height: "13",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
            });
            var __VLS_167;
        }
    }
}
else if (__VLS_ctx.ytSubNav === 'history') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "history-filter-bar" },
        ...{ style: {} },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.ytSubNav === 'download'))
                    return;
                if (!!(__VLS_ctx.ytSubNav === 'pending'))
                    return;
                if (!(__VLS_ctx.ytSubNav === 'history'))
                    return;
                __VLS_ctx.historyFilter = 'all';
            } },
        ...{ class: "history-filter-item" },
        ...{ class: ({ 'is-active': __VLS_ctx.historyFilter === 'all' }) },
    });
    (__VLS_ctx.t('filter_all'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.ytSubNav === 'download'))
                    return;
                if (!!(__VLS_ctx.ytSubNav === 'pending'))
                    return;
                if (!(__VLS_ctx.ytSubNav === 'history'))
                    return;
                __VLS_ctx.historyFilter = 'downloading';
            } },
        ...{ class: "history-filter-item" },
        ...{ class: ({ 'is-active': __VLS_ctx.historyFilter === 'downloading' }) },
    });
    (__VLS_ctx.t('filter_downloading'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.ytSubNav === 'download'))
                    return;
                if (!!(__VLS_ctx.ytSubNav === 'pending'))
                    return;
                if (!(__VLS_ctx.ytSubNav === 'history'))
                    return;
                __VLS_ctx.historyFilter = 'completed';
            } },
        ...{ class: "history-filter-item" },
        ...{ class: ({ 'is-active': __VLS_ctx.historyFilter === 'completed' }) },
    });
    (__VLS_ctx.t('filter_completed'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.ytSubNav === 'download'))
                    return;
                if (!!(__VLS_ctx.ytSubNav === 'pending'))
                    return;
                if (!(__VLS_ctx.ytSubNav === 'history'))
                    return;
                __VLS_ctx.historyFilter = 'cancelled';
            } },
        ...{ class: "history-filter-item" },
        ...{ class: ({ 'is-active': __VLS_ctx.historyFilter === 'cancelled' }) },
    });
    (__VLS_ctx.t('filter_cancelled'));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (...[$event]) => {
                if (!!(__VLS_ctx.ytSubNav === 'download'))
                    return;
                if (!!(__VLS_ctx.ytSubNav === 'pending'))
                    return;
                if (!(__VLS_ctx.ytSubNav === 'history'))
                    return;
                __VLS_ctx.historyFilter = 'failed';
            } },
        ...{ class: "history-filter-item" },
        ...{ class: ({ 'is-active': __VLS_ctx.historyFilter === 'failed' }) },
    });
    (__VLS_ctx.t('filter_failed'));
    if (__VLS_ctx.taskStore.downloadHistory.length > 0) {
        const __VLS_172 = {}.NButton;
        /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
        // @ts-ignore
        const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
            ...{ 'onClick': {} },
            size: "tiny",
            secondary: true,
            ...{ style: {} },
        }));
        const __VLS_174 = __VLS_173({
            ...{ 'onClick': {} },
            size: "tiny",
            secondary: true,
            ...{ style: {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_173));
        let __VLS_176;
        let __VLS_177;
        let __VLS_178;
        const __VLS_179 = {
            onClick: (__VLS_ctx.clearHistory)
        };
        __VLS_175.slots.default;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "12",
            height: "12",
            stroke: "currentColor",
            'stroke-width': "2",
            fill: "none",
            ...{ style: {} },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
            points: "3 6 5 6 21 6",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
        });
        (__VLS_ctx.t('clear_history'));
        var __VLS_175;
    }
    if (__VLS_ctx.filteredHistory.length === 0) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "history-empty-view" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-icon-box" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "32",
            height: "32",
            stroke: "currentColor",
            'stroke-width': "1.6",
            fill: "none",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
            d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline, __VLS_intrinsicElements.polyline)({
            points: "3.27 6.96 12 12.01 20.73 6.96",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.line, __VLS_intrinsicElements.line)({
            x1: "12",
            y1: "22.08",
            x2: "12",
            y2: "12",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-label" },
        });
        (__VLS_ctx.historyEmptyTitle);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ style: {} },
        });
        (__VLS_ctx.t('empty_tasks_sub'));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "history-list" },
        });
        for (const [item] of __VLS_getVForSourceType((__VLS_ctx.filteredHistory))) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                key: (item.id),
                ...{ class: "history-card" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: {} },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ style: {} },
            });
            if (item.thumbnail) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
                    src: (item.thumbnail),
                    ...{ class: "history-thumb" },
                    ...{ style: {} },
                });
            }
            else {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                    ...{ style: {} },
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                    viewBox: "0 0 24 24",
                    width: "20",
                    height: "20",
                    stroke: "currentColor",
                    'stroke-width': "2",
                    fill: "none",
                });
                __VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
                    points: "5 3 19 12 5 21 5 3",
                });
            }
            if (item.duration) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                    ...{ style: {} },
                });
                (item.duration);
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-info" },
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-title" },
                title: (item.title),
            });
            (item.title);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-meta" },
            });
            const __VLS_180 = {}.NTag;
            /** @type {[typeof __VLS_components.NTag, typeof __VLS_components.nTag, typeof __VLS_components.NTag, typeof __VLS_components.nTag, ]} */ ;
            // @ts-ignore
            const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
                size: "tiny",
                type: (item.status === 'completed' ? 'success' : (item.status === 'downloading' ? 'warning' : (item.status === 'failed' ? 'error' : 'default'))),
            }));
            const __VLS_182 = __VLS_181({
                size: "tiny",
                type: (item.status === 'completed' ? 'success' : (item.status === 'downloading' ? 'warning' : (item.status === 'failed' ? 'error' : 'default'))),
            }, ...__VLS_functionalComponentArgsRest(__VLS_181));
            __VLS_183.slots.default;
            (item.status === 'completed' ? __VLS_ctx.t('status_completed') : (item.status === 'downloading' ? (__VLS_ctx.t('status_downloading') + ' (' + item.progress + '%)') : (item.status === 'failed' ? __VLS_ctx.t('status_failed') : __VLS_ctx.t('status_cancelled'))));
            var __VLS_183;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (item.resolution);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
                ...{ style: {} },
            });
            (item.container);
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
            (item.date);
            if (item.status === 'downloading') {
                const __VLS_184 = {}.NProgress;
                /** @type {[typeof __VLS_components.NProgress, typeof __VLS_components.nProgress, ]} */ ;
                // @ts-ignore
                const __VLS_185 = __VLS_asFunctionalComponent(__VLS_184, new __VLS_184({
                    type: "line",
                    percentage: (item.progress),
                    processing: true,
                    status: "success",
                    ...{ style: {} },
                }));
                const __VLS_186 = __VLS_185({
                    type: "line",
                    percentage: (item.progress),
                    processing: true,
                    status: "success",
                    ...{ style: {} },
                }, ...__VLS_functionalComponentArgsRest(__VLS_185));
            }
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "history-actions" },
            });
            if (item.status === 'completed') {
                const __VLS_188 = {}.NButton;
                /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
                // @ts-ignore
                const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
                    ...{ 'onClick': {} },
                    size: "tiny",
                    secondary: true,
                    title: (__VLS_ctx.t('open_file')),
                }));
                const __VLS_190 = __VLS_189({
                    ...{ 'onClick': {} },
                    size: "tiny",
                    secondary: true,
                    title: (__VLS_ctx.t('open_file')),
                }, ...__VLS_functionalComponentArgsRest(__VLS_189));
                let __VLS_192;
                let __VLS_193;
                let __VLS_194;
                const __VLS_195 = {
                    onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.ytSubNav === 'download'))
                            return;
                        if (!!(__VLS_ctx.ytSubNav === 'pending'))
                            return;
                        if (!(__VLS_ctx.ytSubNav === 'history'))
                            return;
                        if (!!(__VLS_ctx.filteredHistory.length === 0))
                            return;
                        if (!(item.status === 'completed'))
                            return;
                        __VLS_ctx.openHistoryFile(item);
                    }
                };
                __VLS_191.slots.default;
                {
                    const { icon: __VLS_thisSlot } = __VLS_191.slots;
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                        viewBox: "0 0 24 24",
                        width: "12",
                        height: "12",
                        stroke: "currentColor",
                        'stroke-width': "2",
                        fill: "none",
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.polygon)({
                        points: "5 3 19 12 5 21 5 3",
                    });
                }
                (__VLS_ctx.t('open_file'));
                var __VLS_191;
            }
            if (item.status === 'completed') {
                const __VLS_196 = {}.NButton;
                /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
                // @ts-ignore
                const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
                    ...{ 'onClick': {} },
                    size: "tiny",
                    secondary: true,
                    title: (__VLS_ctx.t('open_folder')),
                }));
                const __VLS_198 = __VLS_197({
                    ...{ 'onClick': {} },
                    size: "tiny",
                    secondary: true,
                    title: (__VLS_ctx.t('open_folder')),
                }, ...__VLS_functionalComponentArgsRest(__VLS_197));
                let __VLS_200;
                let __VLS_201;
                let __VLS_202;
                const __VLS_203 = {
                    onClick: (...[$event]) => {
                        if (!!(__VLS_ctx.ytSubNav === 'download'))
                            return;
                        if (!!(__VLS_ctx.ytSubNav === 'pending'))
                            return;
                        if (!(__VLS_ctx.ytSubNav === 'history'))
                            return;
                        if (!!(__VLS_ctx.filteredHistory.length === 0))
                            return;
                        if (!(item.status === 'completed'))
                            return;
                        __VLS_ctx.openHistoryFolder(item);
                    }
                };
                __VLS_199.slots.default;
                {
                    const { icon: __VLS_thisSlot } = __VLS_199.slots;
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                        viewBox: "0 0 24 24",
                        width: "12",
                        height: "12",
                        stroke: "currentColor",
                        'stroke-width': "2",
                        fill: "none",
                    });
                    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                        d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
                    });
                }
                (__VLS_ctx.t('open_folder'));
                var __VLS_199;
            }
            if (item.status === 'downloading') {
                const __VLS_204 = {}.NButton;
                /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
                // @ts-ignore
                const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
                    ...{ 'onClick': {} },
                    size: "tiny",
                    type: "error",
                    secondary: true,
                }));
                const __VLS_206 = __VLS_205({
                    ...{ 'onClick': {} },
                    size: "tiny",
                    type: "error",
                    secondary: true,
                }, ...__VLS_functionalComponentArgsRest(__VLS_205));
                let __VLS_208;
                let __VLS_209;
                let __VLS_210;
                const __VLS_211 = {
                    onClick: (__VLS_ctx.cancelTask)
                };
                __VLS_207.slots.default;
                (__VLS_ctx.t('stop'));
                var __VLS_207;
            }
            const __VLS_212 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
                ...{ 'onClick': {} },
                size: "tiny",
                quaternary: true,
                circle: true,
                title: (__VLS_ctx.t('copy_link')),
            }));
            const __VLS_214 = __VLS_213({
                ...{ 'onClick': {} },
                size: "tiny",
                quaternary: true,
                circle: true,
                title: (__VLS_ctx.t('copy_link')),
            }, ...__VLS_functionalComponentArgsRest(__VLS_213));
            let __VLS_216;
            let __VLS_217;
            let __VLS_218;
            const __VLS_219 = {
                onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.ytSubNav === 'download'))
                        return;
                    if (!!(__VLS_ctx.ytSubNav === 'pending'))
                        return;
                    if (!(__VLS_ctx.ytSubNav === 'history'))
                        return;
                    if (!!(__VLS_ctx.filteredHistory.length === 0))
                        return;
                    __VLS_ctx.copyToClipboard(item.url);
                }
            };
            __VLS_215.slots.default;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "13",
                height: "13",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
            });
            var __VLS_215;
            const __VLS_220 = {}.NButton;
            /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
            // @ts-ignore
            const __VLS_221 = __VLS_asFunctionalComponent(__VLS_220, new __VLS_220({
                ...{ 'onClick': {} },
                size: "tiny",
                quaternary: true,
                circle: true,
                title: (__VLS_ctx.t('delete')),
                ...{ style: {} },
            }));
            const __VLS_222 = __VLS_221({
                ...{ 'onClick': {} },
                size: "tiny",
                quaternary: true,
                circle: true,
                title: (__VLS_ctx.t('delete')),
                ...{ style: {} },
            }, ...__VLS_functionalComponentArgsRest(__VLS_221));
            let __VLS_224;
            let __VLS_225;
            let __VLS_226;
            const __VLS_227 = {
                onClick: (...[$event]) => {
                    if (!!(__VLS_ctx.ytSubNav === 'download'))
                        return;
                    if (!!(__VLS_ctx.ytSubNav === 'pending'))
                        return;
                    if (!(__VLS_ctx.ytSubNav === 'history'))
                        return;
                    if (!!(__VLS_ctx.filteredHistory.length === 0))
                        return;
                    __VLS_ctx.removeHistoryItem(item);
                }
            };
            __VLS_223.slots.default;
            __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
                viewBox: "0 0 24 24",
                width: "13",
                height: "13",
                stroke: "currentColor",
                'stroke-width': "2",
                fill: "none",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
                points: "3 6 5 6 21 6",
            });
            __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
                d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2",
            });
            var __VLS_223;
        }
    }
}
/** @type {__VLS_StyleScopedClasses['yt-nav-header']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-header-tabs']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-header-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-header-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-header-tab']} */ ;
/** @type {__VLS_StyleScopedClasses['tab-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-welcome-container']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-welcome-title']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-mode-pills']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-pill-input']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-search-box']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-quick-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-quick-left']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-quick-right']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-center-tools']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-analyzed-container']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-url-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-card']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-meta-header']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-thumb-wrapper']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-thumb-img']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-duration-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-meta-info']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-video-title']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-channel-row']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-views-row']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-card']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-mode-selector']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-mode-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-mode-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-mode-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-card']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-grid-2']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['form-field']} */ ;
/** @type {__VLS_StyleScopedClasses['field-label']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-checkbox-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-card']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-section-label']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-bottom-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-size-label']} */ ;
/** @type {__VLS_StyleScopedClasses['yt-download-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['history-empty-view']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-icon-box']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-label']} */ ;
/** @type {__VLS_StyleScopedClasses['history-list']} */ ;
/** @type {__VLS_StyleScopedClasses['history-card']} */ ;
/** @type {__VLS_StyleScopedClasses['history-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['history-info']} */ ;
/** @type {__VLS_StyleScopedClasses['history-title']} */ ;
/** @type {__VLS_StyleScopedClasses['history-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['history-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['history-filter-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['history-filter-item']} */ ;
/** @type {__VLS_StyleScopedClasses['history-filter-item']} */ ;
/** @type {__VLS_StyleScopedClasses['history-filter-item']} */ ;
/** @type {__VLS_StyleScopedClasses['history-filter-item']} */ ;
/** @type {__VLS_StyleScopedClasses['history-filter-item']} */ ;
/** @type {__VLS_StyleScopedClasses['history-empty-view']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-icon-box']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-label']} */ ;
/** @type {__VLS_StyleScopedClasses['history-list']} */ ;
/** @type {__VLS_StyleScopedClasses['history-card']} */ ;
/** @type {__VLS_StyleScopedClasses['history-thumb']} */ ;
/** @type {__VLS_StyleScopedClasses['history-info']} */ ;
/** @type {__VLS_StyleScopedClasses['history-title']} */ ;
/** @type {__VLS_StyleScopedClasses['history-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['history-actions']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NInput: NInput,
            NButton: NButton,
            NSelect: NSelect,
            NSwitch: NSwitch,
            NCheckbox: NCheckbox,
            NTag: NTag,
            NProgress: NProgress,
            NFlex: NFlex,
            t: t,
            appStore: appStore,
            configStore: configStore,
            taskStore: taskStore,
            ytSubNav: ytSubNav,
            ytDownloadType: ytDownloadType,
            ytUrl: ytUrl,
            isAnalyzing: isAnalyzing,
            ytVideoMeta: ytVideoMeta,
            downloadMode: downloadMode,
            selectedVideoFormatId: selectedVideoFormatId,
            selectedAudioFormatId: selectedAudioFormatId,
            ytContainer: ytContainer,
            ytEnableTrim: ytEnableTrim,
            ytTrimStart: ytTrimStart,
            ytTrimEnd: ytTrimEnd,
            ytEmbedMeta: ytEmbedMeta,
            ytEmbedSubs: ytEmbedSubs,
            ytEmbedThumb: ytEmbedThumb,
            ytSponsorblock: ytSponsorblock,
            historyFilter: historyFilter,
            containerOptions: containerOptions,
            videoFormatSelectOptions: videoFormatSelectOptions,
            audioFormatSelectOptions: audioFormatSelectOptions,
            calculatedSizeText: calculatedSizeText,
            pendingTasks: pendingTasks,
            pendingCount: pendingCount,
            filteredHistory: filteredHistory,
            historyEmptyTitle: historyEmptyTitle,
            formatViews: formatViews,
            handlePickCookies: handlePickCookies,
            handlePickOutputDir: handlePickOutputDir,
            handlePasteUrl: handlePasteUrl,
            resetAnalysis: resetAnalysis,
            handleAnalyze: handleAnalyze,
            handleDownload: handleDownload,
            cancelTask: cancelTask,
            copyToClipboard: copyToClipboard,
            openHistoryFile: openHistoryFile,
            openHistoryFolder: openHistoryFolder,
            removeHistoryItem: removeHistoryItem,
            clearHistory: clearHistory,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=DownloaderView.vue.js.map
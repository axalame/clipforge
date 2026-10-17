import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NSelect, useMessage } from "naive-ui";
import { useAppStore } from "@/stores/app";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";
const { t } = useI18n();
const message = useMessage();
const appStore = useAppStore();
const configStore = useConfigStore();
const isRefreshingConfig = ref(false);
const isCheckingUpdate = ref(false);
const isCheckingDenoUpdate = ref(false);
const isCheckingFfmpegUpdate = ref(false);
const ytdlpSource = ref("custom");
const denoSource = ref("builtin");
const ffmpegSource = ref("builtin");
const config = ref({
    ffmpeg_dir: "ffmpeg",
    ytdlp_path: "yt-dlp",
    deno_path: "deno",
    ytdlp_channel: "stable",
    output_dir: "downloads",
    cookie_source: "none",
    cookie_file: "",
    tools: {
        ytdlp: { ok: false, version: "", path: "" },
        deno: { ok: false, version: "", path: "" },
        ffmpeg: { ok: false, version: "", path: "" },
        cookie: { ok: false },
    },
});
const sourceOptions = computed(() => [
    { label: t("source_builtin"), value: "builtin" },
    { label: t("source_path"), value: "path" },
    { label: t("source_custom"), value: "custom" },
]);
const ytdlpChannelOptions = computed(() => [
    { label: "Stable", value: "stable" },
    { label: "Nightly", value: "nightly" },
    { label: "Master", value: "master" },
]);
const setAppTheme = (mode) => {
    appStore.setTheme(mode);
};
const setAppLang = (lang) => {
    appStore.setLanguage(lang);
};
const loadConfig = async () => {
    isRefreshingConfig.value = true;
    try {
        const data = await apiClient.getConfig();
        if (data) {
            config.value = data;
        }
        await configStore.fetchConfig();
    }
    catch (e) {
        console.error(e);
    }
    finally {
        isRefreshingConfig.value = false;
    }
};
const saveConfig = async () => {
    try {
        const res = await apiClient.saveConfig({
            ffmpeg_dir: config.value.ffmpeg_dir,
            ytdlp_path: config.value.ytdlp_path,
            deno_path: config.value.deno_path,
            ytdlp_channel: config.value.ytdlp_channel || "stable",
            output_dir: config.value.output_dir,
            cookie_source: config.value.cookie_source,
            cookie_file: config.value.cookie_file,
        });
        if (res) {
            config.value = res;
        }
        await configStore.fetchConfig();
        message.success(t("msg_settings_saved"));
    }
    catch (e) {
        message.error(String(e));
    }
};
const checkYtdlpUpdate = async () => {
    isCheckingUpdate.value = true;
    try {
        const res = await apiClient.updateYtdlp();
        if (res.ok) {
            message.success(res.msg || t("msg_ytdlp_actual"));
        }
        else {
            message.info(res.msg || t("msg_check_finished"));
        }
        await loadConfig();
    }
    catch (e) {
        message.error(t("msg_update_error") + e);
    }
    finally {
        isCheckingUpdate.value = false;
    }
};
const checkDenoUpdate = async () => {
    isCheckingDenoUpdate.value = true;
    try {
        const res = await apiClient.checkDenoUpdate();
        if (res.ok) {
            message.success(res.msg || t("msg_deno_actual"));
        }
        else {
            message.info(res.msg || t("msg_deno_finished"));
        }
        await loadConfig();
    }
    catch (e) {
        message.error(t("msg_deno_error") + e);
    }
    finally {
        isCheckingDenoUpdate.value = false;
    }
};
const checkFfmpegUpdate = async () => {
    isCheckingFfmpegUpdate.value = true;
    try {
        const res = await apiClient.checkFfmpegUpdate();
        if (res.ok) {
            if (res.is_latest) {
                message.success(res.msg || t("msg_ffmpeg_actual"));
            }
            else {
                message.info(res.msg || t("msg_ffmpeg_update_avail"));
            }
        }
        else {
            message.warning(res.msg || t("msg_ffmpeg_finished"));
        }
        await loadConfig();
    }
    catch (e) {
        message.error(t("msg_ffmpeg_error") + e);
    }
    finally {
        isCheckingFfmpegUpdate.value = false;
    }
};
const copyToClipboard = async (text) => {
    if (!text)
        return;
    try {
        await navigator.clipboard.writeText(text);
        message.success(t("msg_copied"));
    }
    catch {
        message.info(t("msg_copied") + ": " + text);
    }
};
const pickYtdlp = async () => {
    const f = await apiClient.selectFiles();
    if (f && f.length > 0) {
        config.value.ytdlp_path = f[0];
        await saveConfig();
    }
};
const pickDeno = async () => {
    const f = await apiClient.selectFiles();
    if (f && f.length > 0) {
        config.value.deno_path = f[0];
        await saveConfig();
    }
};
const pickFfmpegDir = async () => {
    const d = await apiClient.selectFolder();
    if (d) {
        config.value.ffmpeg_dir = d;
        await saveConfig();
    }
};
const pickCookie = async () => {
    const f = await apiClient.selectCookiesFile();
    if (f) {
        config.value.cookie_file = f;
        config.value.cookie_source = "file";
        await saveConfig();
        message.success(t("msg_cookies_saved"));
    }
};
const pickOutputDir = async () => {
    const d = await apiClient.selectFolder();
    if (d) {
        config.value.output_dir = d;
        await saveConfig();
    }
};
const openOutputDir = () => {
    if (config.value.output_dir) {
        apiClient.openInExplorer(config.value.output_dir);
    }
};
onMounted(() => {
    loadConfig();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "settings-container" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "settings-section-header" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "settings-section-title" },
});
(__VLS_ctx.t('settings_required'));
const __VLS_0 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
    loading: (__VLS_ctx.isRefreshingConfig),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
    loading: (__VLS_ctx.isRefreshingConfig),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (__VLS_ctx.loadConfig)
};
__VLS_3.slots.default;
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "23 4 23 10 17 10",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M20.49 15a9 9 0 1 1-2.12-9.36L23 10",
});
(__VLS_ctx.t('refresh'));
var __VLS_3;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card-top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-title-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-name" },
});
(__VLS_ctx.t('settings_ui_section'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-pill pill-success" },
});
(__VLS_ctx.t('status_active'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-desc" },
});
(__VLS_ctx.t('settings_ui_desc'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('theme_title'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_8 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.themeMode === 'system' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.themeMode !== 'system'),
}));
const __VLS_10 = __VLS_9({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.themeMode === 'system' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.themeMode !== 'system'),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
let __VLS_12;
let __VLS_13;
let __VLS_14;
const __VLS_15 = {
    onClick: (...[$event]) => {
        __VLS_ctx.setAppTheme('system');
    }
};
__VLS_11.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_11.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "14",
        height: "14",
        stroke: "currentColor",
        'stroke-width': "1.8",
        fill: "none",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
        x: "2",
        y: "3",
        width: "20",
        height: "14",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "8",
        y1: "21",
        x2: "16",
        y2: "21",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "12",
        y1: "17",
        x2: "12",
        y2: "21",
    });
}
(__VLS_ctx.t('theme_system'));
var __VLS_11;
const __VLS_16 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(__VLS_16, new __VLS_16({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.themeMode === 'dark' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.themeMode !== 'dark'),
}));
const __VLS_18 = __VLS_17({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.themeMode === 'dark' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.themeMode !== 'dark'),
}, ...__VLS_functionalComponentArgsRest(__VLS_17));
let __VLS_20;
let __VLS_21;
let __VLS_22;
const __VLS_23 = {
    onClick: (...[$event]) => {
        __VLS_ctx.setAppTheme('dark');
    }
};
__VLS_19.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_19.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "14",
        height: "14",
        stroke: "currentColor",
        'stroke-width': "1.8",
        fill: "none",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
    });
}
(__VLS_ctx.t('theme_dark'));
var __VLS_19;
const __VLS_24 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.themeMode === 'light' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.themeMode !== 'light'),
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.themeMode === 'light' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.themeMode !== 'light'),
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClick: (...[$event]) => {
        __VLS_ctx.setAppTheme('light');
    }
};
__VLS_27.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_27.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "14",
        height: "14",
        stroke: "currentColor",
        'stroke-width': "1.8",
        fill: "none",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        cx: "12",
        cy: "12",
        r: "5",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "12",
        y1: "1",
        x2: "12",
        y2: "3",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "12",
        y1: "21",
        x2: "12",
        y2: "23",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "4.22",
        y1: "4.22",
        x2: "5.64",
        y2: "5.64",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "18.36",
        y1: "18.36",
        x2: "19.78",
        y2: "19.78",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "1",
        y1: "12",
        x2: "3",
        y2: "12",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "21",
        y1: "12",
        x2: "23",
        y2: "12",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "4.22",
        y1: "19.78",
        x2: "5.64",
        y2: "18.36",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "18.36",
        y1: "5.64",
        x2: "19.78",
        y2: "4.22",
    });
}
(__VLS_ctx.t('theme_light'));
var __VLS_27;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('lang_title'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_32 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.currentLang === 'ru' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.currentLang !== 'ru'),
}));
const __VLS_34 = __VLS_33({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.currentLang === 'ru' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.currentLang !== 'ru'),
}, ...__VLS_functionalComponentArgsRest(__VLS_33));
let __VLS_36;
let __VLS_37;
let __VLS_38;
const __VLS_39 = {
    onClick: (...[$event]) => {
        __VLS_ctx.setAppLang('ru');
    }
};
__VLS_35.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_35.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "14",
        height: "14",
        stroke: "currentColor",
        'stroke-width': "1.8",
        fill: "none",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "2",
        y1: "12",
        x2: "22",
        y2: "12",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z",
    });
}
var __VLS_35;
const __VLS_40 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_41 = __VLS_asFunctionalComponent(__VLS_40, new __VLS_40({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.currentLang === 'en' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.currentLang !== 'en'),
}));
const __VLS_42 = __VLS_41({
    ...{ 'onClick': {} },
    size: "small",
    type: (__VLS_ctx.appStore.currentLang === 'en' ? 'primary' : 'default'),
    secondary: (__VLS_ctx.appStore.currentLang !== 'en'),
}, ...__VLS_functionalComponentArgsRest(__VLS_41));
let __VLS_44;
let __VLS_45;
let __VLS_46;
const __VLS_47 = {
    onClick: (...[$event]) => {
        __VLS_ctx.setAppLang('en');
    }
};
__VLS_43.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_43.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "14",
        height: "14",
        stroke: "currentColor",
        'stroke-width': "1.8",
        fill: "none",
        'stroke-linecap': "round",
        'stroke-linejoin': "round",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.circle)({
        cx: "12",
        cy: "12",
        r: "10",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
        x1: "2",
        y1: "12",
        x2: "22",
        y2: "12",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z",
    });
}
var __VLS_43;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card-top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-title-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-name" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-pill" },
    ...{ class: (__VLS_ctx.config.tools?.ytdlp?.ok ? 'pill-success' : 'pill-danger') },
});
(__VLS_ctx.config.tools?.ytdlp?.ok ? __VLS_ctx.t('installed') : __VLS_ctx.t('not_found'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-top-actions" },
});
const __VLS_48 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_49 = __VLS_asFunctionalComponent(__VLS_48, new __VLS_48({
    value: (__VLS_ctx.ytdlpSource),
    options: (__VLS_ctx.sourceOptions),
    size: "small",
    ...{ style: {} },
}));
const __VLS_50 = __VLS_49({
    value: (__VLS_ctx.ytdlpSource),
    options: (__VLS_ctx.sourceOptions),
    size: "small",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_49));
const __VLS_52 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_53 = __VLS_asFunctionalComponent(__VLS_52, new __VLS_52({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
    loading: (__VLS_ctx.isCheckingUpdate),
}));
const __VLS_54 = __VLS_53({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
    loading: (__VLS_ctx.isCheckingUpdate),
}, ...__VLS_functionalComponentArgsRest(__VLS_53));
let __VLS_56;
let __VLS_57;
let __VLS_58;
const __VLS_59 = {
    onClick: (__VLS_ctx.checkYtdlpUpdate)
};
__VLS_55.slots.default;
(__VLS_ctx.t('check_updates'));
var __VLS_55;
const __VLS_60 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_61 = __VLS_asFunctionalComponent(__VLS_60, new __VLS_60({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}));
const __VLS_62 = __VLS_61({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_61));
let __VLS_64;
let __VLS_65;
let __VLS_66;
const __VLS_67 = {
    onClick: (__VLS_ctx.pickYtdlp)
};
__VLS_63.slots.default;
(__VLS_ctx.t('browse'));
var __VLS_63;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-desc" },
});
(__VLS_ctx.t('ytdlp_desc'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('update_channel'));
const __VLS_68 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_69 = __VLS_asFunctionalComponent(__VLS_68, new __VLS_68({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.config.ytdlp_channel),
    options: (__VLS_ctx.ytdlpChannelOptions),
    size: "small",
    ...{ style: {} },
}));
const __VLS_70 = __VLS_69({
    ...{ 'onUpdate:value': {} },
    value: (__VLS_ctx.config.ytdlp_channel),
    options: (__VLS_ctx.ytdlpChannelOptions),
    size: "small",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_69));
let __VLS_72;
let __VLS_73;
let __VLS_74;
const __VLS_75 = {
    'onUpdate:value': (__VLS_ctx.saveConfig)
};
var __VLS_71;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('version'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-value" },
});
(__VLS_ctx.config.tools?.ytdlp?.version || __VLS_ctx.t('not_detected'));
const __VLS_76 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_77 = __VLS_asFunctionalComponent(__VLS_76, new __VLS_76({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_version')),
}));
const __VLS_78 = __VLS_77({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_version')),
}, ...__VLS_functionalComponentArgsRest(__VLS_77));
let __VLS_80;
let __VLS_81;
let __VLS_82;
const __VLS_83 = {
    onClick: (...[$event]) => {
        __VLS_ctx.copyToClipboard(__VLS_ctx.config.tools?.ytdlp?.version);
    }
};
__VLS_79.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
});
var __VLS_79;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('path'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-value path-mono" },
});
(__VLS_ctx.config.tools?.ytdlp?.path || __VLS_ctx.config.ytdlp_path || 'yt-dlp');
const __VLS_84 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_85 = __VLS_asFunctionalComponent(__VLS_84, new __VLS_84({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_path')),
}));
const __VLS_86 = __VLS_85({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_path')),
}, ...__VLS_functionalComponentArgsRest(__VLS_85));
let __VLS_88;
let __VLS_89;
let __VLS_90;
const __VLS_91 = {
    onClick: (...[$event]) => {
        __VLS_ctx.copyToClipboard(__VLS_ctx.config.tools?.ytdlp?.path || __VLS_ctx.config.ytdlp_path);
    }
};
__VLS_87.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
});
var __VLS_87;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card-top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-title-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-name" },
});
(__VLS_ctx.t('deno_title'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-pill" },
    ...{ class: (__VLS_ctx.config.tools?.deno?.ok ? 'pill-success' : 'pill-danger') },
});
(__VLS_ctx.config.tools?.deno?.ok ? __VLS_ctx.t('installed') : __VLS_ctx.t('not_found'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-top-actions" },
});
const __VLS_92 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_93 = __VLS_asFunctionalComponent(__VLS_92, new __VLS_92({
    value: (__VLS_ctx.denoSource),
    options: (__VLS_ctx.sourceOptions),
    size: "small",
    ...{ style: {} },
}));
const __VLS_94 = __VLS_93({
    value: (__VLS_ctx.denoSource),
    options: (__VLS_ctx.sourceOptions),
    size: "small",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_93));
const __VLS_96 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_97 = __VLS_asFunctionalComponent(__VLS_96, new __VLS_96({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
    loading: (__VLS_ctx.isCheckingDenoUpdate),
}));
const __VLS_98 = __VLS_97({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
    loading: (__VLS_ctx.isCheckingDenoUpdate),
}, ...__VLS_functionalComponentArgsRest(__VLS_97));
let __VLS_100;
let __VLS_101;
let __VLS_102;
const __VLS_103 = {
    onClick: (__VLS_ctx.checkDenoUpdate)
};
__VLS_99.slots.default;
(__VLS_ctx.t('check_updates'));
var __VLS_99;
const __VLS_104 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_105 = __VLS_asFunctionalComponent(__VLS_104, new __VLS_104({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}));
const __VLS_106 = __VLS_105({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_105));
let __VLS_108;
let __VLS_109;
let __VLS_110;
const __VLS_111 = {
    onClick: (__VLS_ctx.pickDeno)
};
__VLS_107.slots.default;
(__VLS_ctx.t('browse'));
var __VLS_107;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-desc" },
});
(__VLS_ctx.t('deno_desc'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('version'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-value" },
});
(__VLS_ctx.config.tools?.deno?.version || __VLS_ctx.t('not_detected'));
const __VLS_112 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_113 = __VLS_asFunctionalComponent(__VLS_112, new __VLS_112({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_version')),
}));
const __VLS_114 = __VLS_113({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_version')),
}, ...__VLS_functionalComponentArgsRest(__VLS_113));
let __VLS_116;
let __VLS_117;
let __VLS_118;
const __VLS_119 = {
    onClick: (...[$event]) => {
        __VLS_ctx.copyToClipboard(__VLS_ctx.config.tools?.deno?.version);
    }
};
__VLS_115.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
});
var __VLS_115;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('path'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-value path-mono" },
});
(__VLS_ctx.config.tools?.deno?.path || __VLS_ctx.config.deno_path || 'deno');
const __VLS_120 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_121 = __VLS_asFunctionalComponent(__VLS_120, new __VLS_120({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_path')),
}));
const __VLS_122 = __VLS_121({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_path')),
}, ...__VLS_functionalComponentArgsRest(__VLS_121));
let __VLS_124;
let __VLS_125;
let __VLS_126;
const __VLS_127 = {
    onClick: (...[$event]) => {
        __VLS_ctx.copyToClipboard(__VLS_ctx.config.tools?.deno?.path || __VLS_ctx.config.deno_path);
    }
};
__VLS_123.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
});
var __VLS_123;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card-top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-title-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-name" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-pill" },
    ...{ class: (__VLS_ctx.config.tools?.ffmpeg?.ok ? 'pill-success' : 'pill-danger') },
});
(__VLS_ctx.config.tools?.ffmpeg?.ok ? __VLS_ctx.t('installed') : __VLS_ctx.t('not_found'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-top-actions" },
});
const __VLS_128 = {}.NSelect;
/** @type {[typeof __VLS_components.NSelect, typeof __VLS_components.nSelect, ]} */ ;
// @ts-ignore
const __VLS_129 = __VLS_asFunctionalComponent(__VLS_128, new __VLS_128({
    value: (__VLS_ctx.ffmpegSource),
    options: (__VLS_ctx.sourceOptions),
    size: "small",
    ...{ style: {} },
}));
const __VLS_130 = __VLS_129({
    value: (__VLS_ctx.ffmpegSource),
    options: (__VLS_ctx.sourceOptions),
    size: "small",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_129));
const __VLS_132 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_133 = __VLS_asFunctionalComponent(__VLS_132, new __VLS_132({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
    loading: (__VLS_ctx.isCheckingFfmpegUpdate),
}));
const __VLS_134 = __VLS_133({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
    loading: (__VLS_ctx.isCheckingFfmpegUpdate),
}, ...__VLS_functionalComponentArgsRest(__VLS_133));
let __VLS_136;
let __VLS_137;
let __VLS_138;
const __VLS_139 = {
    onClick: (__VLS_ctx.checkFfmpegUpdate)
};
__VLS_135.slots.default;
(__VLS_ctx.t('check_updates'));
var __VLS_135;
const __VLS_140 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_141 = __VLS_asFunctionalComponent(__VLS_140, new __VLS_140({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}));
const __VLS_142 = __VLS_141({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_141));
let __VLS_144;
let __VLS_145;
let __VLS_146;
const __VLS_147 = {
    onClick: (__VLS_ctx.pickFfmpegDir)
};
__VLS_143.slots.default;
(__VLS_ctx.t('browse'));
var __VLS_143;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-desc" },
});
(__VLS_ctx.t('ffmpeg_desc'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('version'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-value" },
});
(__VLS_ctx.config.tools?.ffmpeg?.version || __VLS_ctx.t('not_detected'));
const __VLS_148 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_149 = __VLS_asFunctionalComponent(__VLS_148, new __VLS_148({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_version')),
}));
const __VLS_150 = __VLS_149({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_version')),
}, ...__VLS_functionalComponentArgsRest(__VLS_149));
let __VLS_152;
let __VLS_153;
let __VLS_154;
const __VLS_155 = {
    onClick: (...[$event]) => {
        __VLS_ctx.copyToClipboard(__VLS_ctx.config.tools?.ffmpeg?.version);
    }
};
__VLS_151.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
});
var __VLS_151;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('path'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-value path-mono" },
});
(__VLS_ctx.config.tools?.ffmpeg?.path || __VLS_ctx.config.ffmpeg_dir || 'ffmpeg');
const __VLS_156 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_157 = __VLS_asFunctionalComponent(__VLS_156, new __VLS_156({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_path')),
}));
const __VLS_158 = __VLS_157({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_path')),
}, ...__VLS_functionalComponentArgsRest(__VLS_157));
let __VLS_160;
let __VLS_161;
let __VLS_162;
const __VLS_163 = {
    onClick: (...[$event]) => {
        __VLS_ctx.copyToClipboard(__VLS_ctx.config.tools?.ffmpeg?.path || __VLS_ctx.config.ffmpeg_dir);
    }
};
__VLS_159.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
});
var __VLS_159;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card-top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-title-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-name" },
});
(__VLS_ctx.t('cookies_title'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-pill" },
    ...{ class: (__VLS_ctx.config.tools?.cookie?.ok ? 'pill-success' : 'pill-warning') },
});
(__VLS_ctx.config.tools?.cookie?.ok ? __VLS_ctx.t('cookies_connected') : __VLS_ctx.t('not_specified'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-top-actions" },
});
const __VLS_164 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_165 = __VLS_asFunctionalComponent(__VLS_164, new __VLS_164({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}));
const __VLS_166 = __VLS_165({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_165));
let __VLS_168;
let __VLS_169;
let __VLS_170;
const __VLS_171 = {
    onClick: (__VLS_ctx.pickCookie)
};
__VLS_167.slots.default;
(__VLS_ctx.t('select_cookies'));
var __VLS_167;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-desc" },
});
(__VLS_ctx.t('cookies_desc'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('path'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-value path-mono" },
});
(__VLS_ctx.config.cookie_file || __VLS_ctx.t('no_file_selected'));
if (__VLS_ctx.config.cookie_file) {
    const __VLS_172 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_173 = __VLS_asFunctionalComponent(__VLS_172, new __VLS_172({
        ...{ 'onClick': {} },
        text: true,
        size: "tiny",
        ...{ class: "copy-btn" },
        title: (__VLS_ctx.t('copy_path')),
    }));
    const __VLS_174 = __VLS_173({
        ...{ 'onClick': {} },
        text: true,
        size: "tiny",
        ...{ class: "copy-btn" },
        title: (__VLS_ctx.t('copy_path')),
    }, ...__VLS_functionalComponentArgsRest(__VLS_173));
    let __VLS_176;
    let __VLS_177;
    let __VLS_178;
    const __VLS_179 = {
        onClick: (...[$event]) => {
            if (!(__VLS_ctx.config.cookie_file))
                return;
            __VLS_ctx.copyToClipboard(__VLS_ctx.config.cookie_file);
        }
    };
    __VLS_175.slots.default;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "13",
        height: "13",
        stroke: "currentColor",
        'stroke-width': "2",
        fill: "none",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
        x: "9",
        y: "9",
        width: "13",
        height: "13",
        rx: "2",
        ry: "2",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
        d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
    });
    var __VLS_175;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-card-top" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-title-wrap" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "tool-name" },
});
(__VLS_ctx.t('output_folder_title'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "status-pill pill-success" },
});
(__VLS_ctx.t('status_active'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-top-actions" },
});
const __VLS_180 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_181 = __VLS_asFunctionalComponent(__VLS_180, new __VLS_180({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}));
const __VLS_182 = __VLS_181({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_181));
let __VLS_184;
let __VLS_185;
let __VLS_186;
const __VLS_187 = {
    onClick: (__VLS_ctx.pickOutputDir)
};
__VLS_183.slots.default;
(__VLS_ctx.t('select_folder'));
var __VLS_183;
const __VLS_188 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_189 = __VLS_asFunctionalComponent(__VLS_188, new __VLS_188({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}));
const __VLS_190 = __VLS_189({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_189));
let __VLS_192;
let __VLS_193;
let __VLS_194;
const __VLS_195 = {
    onClick: (__VLS_ctx.openOutputDir)
};
__VLS_191.slots.default;
(__VLS_ctx.t('open_explorer'));
var __VLS_191;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-desc" },
});
(__VLS_ctx.t('output_folder_desc'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-grid" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "tool-meta-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-label" },
});
(__VLS_ctx.t('path'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
    ...{ class: "meta-value path-mono" },
});
(__VLS_ctx.config.output_dir || 'downloads');
const __VLS_196 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_197 = __VLS_asFunctionalComponent(__VLS_196, new __VLS_196({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_path')),
}));
const __VLS_198 = __VLS_197({
    ...{ 'onClick': {} },
    text: true,
    size: "tiny",
    ...{ class: "copy-btn" },
    title: (__VLS_ctx.t('copy_path')),
}, ...__VLS_functionalComponentArgsRest(__VLS_197));
let __VLS_200;
let __VLS_201;
let __VLS_202;
const __VLS_203 = {
    onClick: (...[$event]) => {
        __VLS_ctx.copyToClipboard(__VLS_ctx.config.output_dir);
    }
};
__VLS_199.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect)({
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
});
var __VLS_199;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_204 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_205 = __VLS_asFunctionalComponent(__VLS_204, new __VLS_204({
    ...{ 'onClick': {} },
    type: "primary",
    size: "medium",
    ...{ style: {} },
}));
const __VLS_206 = __VLS_205({
    ...{ 'onClick': {} },
    type: "primary",
    size: "medium",
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_205));
let __VLS_208;
let __VLS_209;
let __VLS_210;
const __VLS_211 = {
    onClick: (__VLS_ctx.saveConfig)
};
__VLS_207.slots.default;
(__VLS_ctx.t('save_settings'));
var __VLS_207;
const __VLS_212 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_213 = __VLS_asFunctionalComponent(__VLS_212, new __VLS_212({
    ...{ 'onClick': {} },
    secondary: true,
    size: "medium",
    loading: (__VLS_ctx.isRefreshingConfig),
}));
const __VLS_214 = __VLS_213({
    ...{ 'onClick': {} },
    secondary: true,
    size: "medium",
    loading: (__VLS_ctx.isRefreshingConfig),
}, ...__VLS_functionalComponentArgsRest(__VLS_213));
let __VLS_216;
let __VLS_217;
let __VLS_218;
const __VLS_219 = {
    onClick: (__VLS_ctx.loadConfig)
};
__VLS_215.slots.default;
(__VLS_ctx.t('recheck_components'));
var __VLS_215;
/** @type {__VLS_StyleScopedClasses['settings-container']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-header']} */ ;
/** @type {__VLS_StyleScopedClasses['settings-section-title']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-title-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-name']} */ ;
/** @type {__VLS_StyleScopedClasses['status-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-success']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-title-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-name']} */ ;
/** @type {__VLS_StyleScopedClasses['status-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-value']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-value']} */ ;
/** @type {__VLS_StyleScopedClasses['path-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-title-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-name']} */ ;
/** @type {__VLS_StyleScopedClasses['status-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-value']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-value']} */ ;
/** @type {__VLS_StyleScopedClasses['path-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-title-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-name']} */ ;
/** @type {__VLS_StyleScopedClasses['status-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-value']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-value']} */ ;
/** @type {__VLS_StyleScopedClasses['path-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-title-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-name']} */ ;
/** @type {__VLS_StyleScopedClasses['status-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-value']} */ ;
/** @type {__VLS_StyleScopedClasses['path-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-card-top']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-title-wrap']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-name']} */ ;
/** @type {__VLS_StyleScopedClasses['status-pill']} */ ;
/** @type {__VLS_StyleScopedClasses['pill-success']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-top-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-desc']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-grid']} */ ;
/** @type {__VLS_StyleScopedClasses['tool-meta-row']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-label']} */ ;
/** @type {__VLS_StyleScopedClasses['meta-value']} */ ;
/** @type {__VLS_StyleScopedClasses['path-mono']} */ ;
/** @type {__VLS_StyleScopedClasses['copy-btn']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NSelect: NSelect,
            t: t,
            appStore: appStore,
            isRefreshingConfig: isRefreshingConfig,
            isCheckingUpdate: isCheckingUpdate,
            isCheckingDenoUpdate: isCheckingDenoUpdate,
            isCheckingFfmpegUpdate: isCheckingFfmpegUpdate,
            ytdlpSource: ytdlpSource,
            denoSource: denoSource,
            ffmpegSource: ffmpegSource,
            config: config,
            sourceOptions: sourceOptions,
            ytdlpChannelOptions: ytdlpChannelOptions,
            setAppTheme: setAppTheme,
            setAppLang: setAppLang,
            loadConfig: loadConfig,
            saveConfig: saveConfig,
            checkYtdlpUpdate: checkYtdlpUpdate,
            checkDenoUpdate: checkDenoUpdate,
            checkFfmpegUpdate: checkFfmpegUpdate,
            copyToClipboard: copyToClipboard,
            pickYtdlp: pickYtdlp,
            pickDeno: pickDeno,
            pickFfmpegDir: pickFfmpegDir,
            pickCookie: pickCookie,
            pickOutputDir: pickOutputDir,
            openOutputDir: openOutputDir,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=SettingsView.vue.js.map
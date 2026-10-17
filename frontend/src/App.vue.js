import { ref, computed, watch, nextTick, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { darkTheme, NConfigProvider, NGlobalStyle, NNotificationProvider, NMessageProvider, NButton, NProgress, } from "naive-ui";
import { useAppStore } from "@/stores/app";
import { useConfigStore } from "@/stores/config";
import { useTaskStore } from "@/stores/task";
import { apiClient } from "@/api/client";
import { showAppNotification } from "@/utils/notification";
import Sidebar from "@/components/layout/Sidebar.vue";
import Topbar from "@/components/layout/Topbar.vue";
import AppNotifier from "@/components/layout/AppNotifier.vue";
import DownloaderView from "@/views/DownloaderView.vue";
import TrimView from "@/views/TrimView.vue";
import GeometryView from "@/views/GeometryView.vue";
import EffectsView from "@/views/EffectsView.vue";
import AudioView from "@/views/AudioView.vue";
import ExportView from "@/views/ExportView.vue";
import MediaView from "@/views/MediaView.vue";
import SettingsView from "@/views/SettingsView.vue";
const { t } = useI18n();
const appStore = useAppStore();
const configStore = useConfigStore();
const taskStore = useTaskStore();
const showTerminal = ref(false);
const displayStatusText = computed(() => {
    return taskStore.statusText || t("status_ready");
});
const handleCancelTask = async () => {
    await apiClient.cancel();
    taskStore.isRunning = false;
    taskStore.statusText = t("status_cancelled");
    showAppNotification("warning", t("notify_cancelled") || "Операция отменена", t("notify_cancelled_desc") || "Процесс был остановлен");
};
const copyTerminalLogs = async () => {
    try {
        await navigator.clipboard.writeText(taskStore.terminalLogs);
    }
    catch (e) {
        console.error(e);
    }
};
watch(() => taskStore.terminalLogs, () => {
    if (showTerminal.value) {
        nextTick(() => {
            const scroller = document.getElementById("terminal-scroller");
            if (scroller) {
                scroller.scrollTop = scroller.scrollHeight;
            }
        });
    }
});
// High-end Studio Theme Overrides (matching tset exactly)
const studioThemeOverrides = {
    common: {
        borderRadius: "6px",
        primaryColor: "#10b981",
        primaryColorHover: "#34d399",
        primaryColorPressed: "#059669",
        primaryColorSuppl: "#10b981",
        bodyColor: "#0b0e14",
        cardColor: "#151b26",
        modalColor: "#151b26",
        borderColor: "rgba(255, 255, 255, 0.08)",
        textColorBase: "#f8fafc",
    },
    Button: {
        borderRadiusMedium: "9999px",
        borderRadiusSmall: "9999px",
        borderRadiusLarge: "9999px",
        borderRadiusTiny: "9999px",
        fontWeight: "500",
        fontWeightStrong: "600",
    },
    Input: {
        borderRadius: "6px",
        color: "#10141d",
        colorFocus: "#121722",
    },
    Select: {
        borderRadius: "6px",
    },
};
const studioThemeOverridesLight = {
    common: {
        borderRadius: "6px",
        primaryColor: "#10b981",
        primaryColorHover: "#059669",
        primaryColorPressed: "#047857",
        primaryColorSuppl: "#10b981",
        bodyColor: "#f8fafc",
        cardColor: "#ffffff",
        modalColor: "#ffffff",
        borderColor: "rgba(0, 0, 0, 0.12)",
        textColorBase: "#0f172a",
        textColor1: "#0f172a",
        textColor2: "#1e293b",
        textColor3: "#475569",
    },
    Button: {
        borderRadiusMedium: "9999px",
        borderRadiusSmall: "9999px",
        borderRadiusLarge: "9999px",
        borderRadiusTiny: "9999px",
        fontWeight: "500",
        fontWeightStrong: "600",
        textColor: "#0f172a",
        textColorDefault: "#0f172a",
        textColorSecondary: "#0f172a",
        colorSecondary: "#f1f5f9",
        colorSecondaryHover: "#e2e8f0",
        borderSecondary: "1px solid rgba(0, 0, 0, 0.08)",
    },
    Input: {
        borderRadius: "6px",
        color: "#ffffff",
        colorFocus: "#ffffff",
        textColor: "#0f172a",
    },
    Select: {
        borderRadius: "6px",
    },
    Dropdown: {
        borderRadius: "8px",
        color: "#ffffff",
        optionTextColor: "#0f172a",
        optionTextColorHover: "#059669",
        optionColorHover: "#f1f5f9",
    },
};
const activeViewComponent = computed(() => {
    switch (appStore.activeNav) {
        case "download":
            return DownloaderView;
        case "trim":
            return TrimView;
        case "geometry":
            return GeometryView;
        case "effects":
            return EffectsView;
        case "audio":
            return AudioView;
        case "export":
            return ExportView;
        case "media":
            return MediaView;
        case "settings":
            return SettingsView;
        default:
            return DownloaderView;
    }
});
onMounted(async () => {
    appStore.initTheme();
    taskStore.bindWindowCallbacks();
    await configStore.fetchConfig();
});
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.NConfigProvider;
/** @type {[typeof __VLS_components.NConfigProvider, typeof __VLS_components.nConfigProvider, typeof __VLS_components.NConfigProvider, typeof __VLS_components.nConfigProvider, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    theme: (__VLS_ctx.appStore.isDark ? __VLS_ctx.darkTheme : null),
    themeOverrides: (__VLS_ctx.appStore.isDark ? __VLS_ctx.studioThemeOverrides : __VLS_ctx.studioThemeOverridesLight),
}));
const __VLS_2 = __VLS_1({
    theme: (__VLS_ctx.appStore.isDark ? __VLS_ctx.darkTheme : null),
    themeOverrides: (__VLS_ctx.appStore.isDark ? __VLS_ctx.studioThemeOverrides : __VLS_ctx.studioThemeOverridesLight),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
const __VLS_5 = {}.NGlobalStyle;
/** @type {[typeof __VLS_components.NGlobalStyle, typeof __VLS_components.nGlobalStyle, ]} */ ;
// @ts-ignore
const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({}));
const __VLS_7 = __VLS_6({}, ...__VLS_functionalComponentArgsRest(__VLS_6));
const __VLS_9 = {}.NNotificationProvider;
/** @type {[typeof __VLS_components.NNotificationProvider, typeof __VLS_components.nNotificationProvider, typeof __VLS_components.NNotificationProvider, typeof __VLS_components.nNotificationProvider, ]} */ ;
// @ts-ignore
const __VLS_10 = __VLS_asFunctionalComponent(__VLS_9, new __VLS_9({
    placement: "bottom-right",
}));
const __VLS_11 = __VLS_10({
    placement: "bottom-right",
}, ...__VLS_functionalComponentArgsRest(__VLS_10));
__VLS_12.slots.default;
const __VLS_13 = {}.NMessageProvider;
/** @type {[typeof __VLS_components.NMessageProvider, typeof __VLS_components.nMessageProvider, typeof __VLS_components.NMessageProvider, typeof __VLS_components.nMessageProvider, ]} */ ;
// @ts-ignore
const __VLS_14 = __VLS_asFunctionalComponent(__VLS_13, new __VLS_13({
    placement: "bottom-right",
}));
const __VLS_15 = __VLS_14({
    placement: "bottom-right",
}, ...__VLS_functionalComponentArgsRest(__VLS_14));
__VLS_16.slots.default;
/** @type {[typeof AppNotifier, typeof AppNotifier, ]} */ ;
// @ts-ignore
const __VLS_17 = __VLS_asFunctionalComponent(AppNotifier, new AppNotifier({}));
const __VLS_18 = __VLS_17({}, ...__VLS_functionalComponentArgsRest(__VLS_17));
__VLS_19.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "studio-shell" },
});
/** @type {[typeof Sidebar, ]} */ ;
// @ts-ignore
const __VLS_20 = __VLS_asFunctionalComponent(Sidebar, new Sidebar({}));
const __VLS_21 = __VLS_20({}, ...__VLS_functionalComponentArgsRest(__VLS_20));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "studio-main" },
});
/** @type {[typeof Topbar, ]} */ ;
// @ts-ignore
const __VLS_23 = __VLS_asFunctionalComponent(Topbar, new Topbar({}));
const __VLS_24 = __VLS_23({}, ...__VLS_functionalComponentArgsRest(__VLS_23));
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "studio-content-scroll" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "studio-container" },
});
const __VLS_26 = {}.KeepAlive;
/** @type {[typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, typeof __VLS_components.KeepAlive, typeof __VLS_components.keepAlive, ]} */ ;
// @ts-ignore
const __VLS_27 = __VLS_asFunctionalComponent(__VLS_26, new __VLS_26({}));
const __VLS_28 = __VLS_27({}, ...__VLS_functionalComponentArgsRest(__VLS_27));
__VLS_29.slots.default;
const __VLS_30 = ((__VLS_ctx.activeViewComponent));
// @ts-ignore
const __VLS_31 = __VLS_asFunctionalComponent(__VLS_30, new __VLS_30({}));
const __VLS_32 = __VLS_31({}, ...__VLS_functionalComponentArgsRest(__VLS_31));
var __VLS_29;
__VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({
    ...{ class: "studio-render-bar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "render-meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "render-title-row" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.displayStatusText);
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.taskStore.metricsText);
const __VLS_34 = {}.NProgress;
/** @type {[typeof __VLS_components.NProgress, typeof __VLS_components.nProgress, ]} */ ;
// @ts-ignore
const __VLS_35 = __VLS_asFunctionalComponent(__VLS_34, new __VLS_34({
    type: "line",
    percentage: (__VLS_ctx.taskStore.progressPercent),
    processing: (__VLS_ctx.taskStore.isRunning),
    status: (__VLS_ctx.taskStore.isRunning ? 'success' : 'default'),
    showIndicator: (false),
    ...{ style: {} },
}));
const __VLS_36 = __VLS_35({
    type: "line",
    percentage: (__VLS_ctx.taskStore.progressPercent),
    processing: (__VLS_ctx.taskStore.isRunning),
    status: (__VLS_ctx.taskStore.isRunning ? 'success' : 'default'),
    showIndicator: (false),
    ...{ style: {} },
}, ...__VLS_functionalComponentArgsRest(__VLS_35));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "render-actions" },
});
const __VLS_38 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_39 = __VLS_asFunctionalComponent(__VLS_38, new __VLS_38({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}));
const __VLS_40 = __VLS_39({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_39));
let __VLS_42;
let __VLS_43;
let __VLS_44;
const __VLS_45 = {
    onClick: (...[$event]) => {
        __VLS_ctx.showTerminal = !__VLS_ctx.showTerminal;
    }
};
__VLS_41.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.polyline)({
    points: "4 17 10 11 4 5",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "12",
    y1: "19",
    x2: "20",
    y2: "19",
});
(__VLS_ctx.t('console_logs'));
var __VLS_41;
if (__VLS_ctx.taskStore.isRunning) {
    const __VLS_46 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_47 = __VLS_asFunctionalComponent(__VLS_46, new __VLS_46({
        ...{ 'onClick': {} },
        size: "small",
        type: "error",
    }));
    const __VLS_48 = __VLS_47({
        ...{ 'onClick': {} },
        size: "small",
        type: "error",
    }, ...__VLS_functionalComponentArgsRest(__VLS_47));
    let __VLS_50;
    let __VLS_51;
    let __VLS_52;
    const __VLS_53 = {
        onClick: (__VLS_ctx.handleCancelTask)
    };
    __VLS_49.slots.default;
    (__VLS_ctx.t('stop'));
    var __VLS_49;
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "terminal-drawer" },
});
__VLS_asFunctionalDirective(__VLS_directives.vShow)(null, { ...__VLS_directiveBindingRestFields, value: (__VLS_ctx.showTerminal) }, null, null);
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "terminal-head" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.t('terminal_title'));
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_54 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_55 = __VLS_asFunctionalComponent(__VLS_54, new __VLS_54({
    ...{ 'onClick': {} },
    size: "tiny",
    secondary: true,
}));
const __VLS_56 = __VLS_55({
    ...{ 'onClick': {} },
    size: "tiny",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_55));
let __VLS_58;
let __VLS_59;
let __VLS_60;
const __VLS_61 = {
    onClick: (__VLS_ctx.copyTerminalLogs)
};
__VLS_57.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "12",
    height: "12",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.rect, __VLS_intrinsicElements.rect)({
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2",
    ry: "2",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.path, __VLS_intrinsicElements.path)({
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
});
(__VLS_ctx.t('terminal_copy'));
var __VLS_57;
const __VLS_62 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_63 = __VLS_asFunctionalComponent(__VLS_62, new __VLS_62({
    ...{ 'onClick': {} },
    size: "tiny",
    secondary: true,
}));
const __VLS_64 = __VLS_63({
    ...{ 'onClick': {} },
    size: "tiny",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_63));
let __VLS_66;
let __VLS_67;
let __VLS_68;
const __VLS_69 = {
    onClick: (...[$event]) => {
        __VLS_ctx.taskStore.terminalLogs = '';
    }
};
__VLS_65.slots.default;
(__VLS_ctx.t('terminal_clear'));
var __VLS_65;
const __VLS_70 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_71 = __VLS_asFunctionalComponent(__VLS_70, new __VLS_70({
    ...{ 'onClick': {} },
    size: "tiny",
    quaternary: true,
}));
const __VLS_72 = __VLS_71({
    ...{ 'onClick': {} },
    size: "tiny",
    quaternary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_71));
let __VLS_74;
let __VLS_75;
let __VLS_76;
const __VLS_77 = {
    onClick: (...[$event]) => {
        __VLS_ctx.showTerminal = false;
    }
};
__VLS_73.slots.default;
(__VLS_ctx.t('terminal_close'));
var __VLS_73;
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "terminal-body" },
    id: "terminal-scroller",
});
(__VLS_ctx.taskStore.terminalLogs);
var __VLS_19;
var __VLS_16;
var __VLS_12;
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['studio-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-main']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-content-scroll']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-container']} */ ;
/** @type {__VLS_StyleScopedClasses['studio-render-bar']} */ ;
/** @type {__VLS_StyleScopedClasses['render-meta']} */ ;
/** @type {__VLS_StyleScopedClasses['render-title-row']} */ ;
/** @type {__VLS_StyleScopedClasses['render-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['terminal-drawer']} */ ;
/** @type {__VLS_StyleScopedClasses['terminal-head']} */ ;
/** @type {__VLS_StyleScopedClasses['terminal-body']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            darkTheme: darkTheme,
            NConfigProvider: NConfigProvider,
            NGlobalStyle: NGlobalStyle,
            NNotificationProvider: NNotificationProvider,
            NMessageProvider: NMessageProvider,
            NButton: NButton,
            NProgress: NProgress,
            Sidebar: Sidebar,
            Topbar: Topbar,
            AppNotifier: AppNotifier,
            t: t,
            appStore: appStore,
            taskStore: taskStore,
            showTerminal: showTerminal,
            displayStatusText: displayStatusText,
            handleCancelTask: handleCancelTask,
            copyTerminalLogs: copyTerminalLogs,
            studioThemeOverrides: studioThemeOverrides,
            studioThemeOverridesLight: studioThemeOverridesLight,
            activeViewComponent: activeViewComponent,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=App.vue.js.map
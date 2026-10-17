import { h, computed } from "vue";
import { useI18n } from "vue-i18n";
import { NButton, NDropdown } from "naive-ui";
import { useAppStore } from "@/stores/app";
import { useQueueStore } from "@/stores/queue";
import { useTaskStore } from "@/stores/task";
import { apiClient } from "@/api/client";
const { t } = useI18n();
const appStore = useAppStore();
const queueStore = useQueueStore();
const taskStore = useTaskStore();
const themeLabel = computed(() => {
    if (appStore.themeMode === "system")
        return t("theme_system");
    return appStore.themeMode === "dark" ? t("theme_dark") : t("theme_light");
});
// Vector SVG Icons for Theme and Language (Unified stroke style matching Sidebar Navigation)
const svgMonitor = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
const svgMoon = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
const svgSun = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
const svgGlobe = '<svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"/></svg>';
const renderDropdownIcon = (svgString) => {
    return () => h("span", {
        style: { display: "inline-flex", alignItems: "center", justifyContent: "center" },
        innerHTML: svgString,
    });
};
const themeOptions = computed(() => [
    {
        label: t("theme_system") + (appStore.themeMode === "system" ? " ✓" : ""),
        key: "system",
        icon: renderDropdownIcon(svgMonitor),
    },
    {
        label: t("theme_dark") + (appStore.themeMode === "dark" ? " ✓" : ""),
        key: "dark",
        icon: renderDropdownIcon(svgMoon),
    },
    {
        label: t("theme_light") + (appStore.themeMode === "light" ? " ✓" : ""),
        key: "light",
        icon: renderDropdownIcon(svgSun),
    },
]);
const langOptions = computed(() => [
    {
        label: (t("lang_ru") || "Русский") + (appStore.currentLang === "ru" ? " ✓" : ""),
        key: "ru",
        icon: renderDropdownIcon(svgGlobe),
    },
    {
        label: (t("lang_en") || "English") + (appStore.currentLang === "en" ? " ✓" : ""),
        key: "en",
        icon: renderDropdownIcon(svgGlobe),
    },
]);
const handleThemeSelect = (key) => {
    appStore.setTheme(key);
};
const handleLangSelect = (key) => {
    appStore.setLanguage(key);
};
const handlePickFiles = async () => {
    const files = await apiClient.pickFiles();
    if (files && files.length > 0) {
        await queueStore.addFiles(files);
    }
};
const handleOpenResult = () => {
    if (taskStore.latestOutput) {
        apiClient.openPath(taskStore.latestOutput);
    }
};
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({
    ...{ class: "studio-topbar" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "topbar-section-title" },
});
if (__VLS_ctx.appStore.activeNav === 'download') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('title_download'));
}
else if (__VLS_ctx.appStore.activeNav === 'trim') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('title_trim'));
}
else if (__VLS_ctx.appStore.activeNav === 'geometry') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('title_geometry'));
}
else if (__VLS_ctx.appStore.activeNav === 'effects') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('title_effects'));
}
else if (__VLS_ctx.appStore.activeNav === 'audio') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('title_audio'));
}
else if (__VLS_ctx.appStore.activeNav === 'export') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('title_export'));
}
else if (__VLS_ctx.appStore.activeNav === 'media') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('title_media'));
}
else if (__VLS_ctx.appStore.activeNav === 'settings') {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (__VLS_ctx.t('title_settings'));
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ style: {} },
});
const __VLS_0 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.themeOptions),
}));
const __VLS_2 = __VLS_1({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.themeOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onSelect: (__VLS_ctx.handleThemeSelect)
};
__VLS_3.slots.default;
const __VLS_8 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_9 = __VLS_asFunctionalComponent(__VLS_8, new __VLS_8({
    size: "small",
    secondary: true,
    title: (__VLS_ctx.t('tooltip_theme')),
}));
const __VLS_10 = __VLS_9({
    size: "small",
    secondary: true,
    title: (__VLS_ctx.t('tooltip_theme')),
}, ...__VLS_functionalComponentArgsRest(__VLS_9));
__VLS_11.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_11.slots;
    if (__VLS_ctx.appStore.themeMode === 'system') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "13",
            height: "13",
            stroke: "currentColor",
            'stroke-width': "2",
            fill: "none",
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
    else if (!__VLS_ctx.appStore.isDark) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "13",
            height: "13",
            stroke: "currentColor",
            'stroke-width': "2",
            fill: "none",
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
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
            viewBox: "0 0 24 24",
            width: "13",
            height: "13",
            stroke: "currentColor",
            'stroke-width': "2",
            fill: "none",
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.path)({
            d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
        });
    }
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
(__VLS_ctx.themeLabel);
var __VLS_11;
var __VLS_3;
const __VLS_12 = {}.NDropdown;
/** @type {[typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, typeof __VLS_components.NDropdown, typeof __VLS_components.nDropdown, ]} */ ;
// @ts-ignore
const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.langOptions),
}));
const __VLS_14 = __VLS_13({
    ...{ 'onSelect': {} },
    trigger: "click",
    options: (__VLS_ctx.langOptions),
}, ...__VLS_functionalComponentArgsRest(__VLS_13));
let __VLS_16;
let __VLS_17;
let __VLS_18;
const __VLS_19 = {
    onSelect: (__VLS_ctx.handleLangSelect)
};
__VLS_15.slots.default;
const __VLS_20 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
    size: "small",
    secondary: true,
    title: (__VLS_ctx.t('tooltip_lang')),
}));
const __VLS_22 = __VLS_21({
    size: "small",
    secondary: true,
    title: (__VLS_ctx.t('tooltip_lang')),
}, ...__VLS_functionalComponentArgsRest(__VLS_21));
__VLS_23.slots.default;
{
    const { icon: __VLS_thisSlot } = __VLS_23.slots;
    __VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
        viewBox: "0 0 24 24",
        width: "13",
        height: "13",
        stroke: "currentColor",
        'stroke-width': "2",
        fill: "none",
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
__VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
((__VLS_ctx.appStore.currentLang || 'ru').toUpperCase());
var __VLS_23;
var __VLS_15;
const __VLS_24 = {}.NButton;
/** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
// @ts-ignore
const __VLS_25 = __VLS_asFunctionalComponent(__VLS_24, new __VLS_24({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}));
const __VLS_26 = __VLS_25({
    ...{ 'onClick': {} },
    size: "small",
    secondary: true,
}, ...__VLS_functionalComponentArgsRest(__VLS_25));
let __VLS_28;
let __VLS_29;
let __VLS_30;
const __VLS_31 = {
    onClick: (__VLS_ctx.handlePickFiles)
};
__VLS_27.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.svg, __VLS_intrinsicElements.svg)({
    viewBox: "0 0 24 24",
    width: "13",
    height: "13",
    stroke: "currentColor",
    'stroke-width': "2",
    fill: "none",
    ...{ style: {} },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "12",
    y1: "5",
    x2: "12",
    y2: "19",
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.line)({
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12",
});
(__VLS_ctx.t('add_files'));
var __VLS_27;
if (__VLS_ctx.taskStore.latestOutput) {
    const __VLS_32 = {}.NButton;
    /** @type {[typeof __VLS_components.NButton, typeof __VLS_components.nButton, typeof __VLS_components.NButton, typeof __VLS_components.nButton, ]} */ ;
    // @ts-ignore
    const __VLS_33 = __VLS_asFunctionalComponent(__VLS_32, new __VLS_32({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
        secondary: true,
    }));
    const __VLS_34 = __VLS_33({
        ...{ 'onClick': {} },
        size: "small",
        type: "primary",
        secondary: true,
    }, ...__VLS_functionalComponentArgsRest(__VLS_33));
    let __VLS_36;
    let __VLS_37;
    let __VLS_38;
    const __VLS_39 = {
        onClick: (__VLS_ctx.handleOpenResult)
    };
    __VLS_35.slots.default;
    (__VLS_ctx.t('open_result'));
    var __VLS_35;
}
/** @type {__VLS_StyleScopedClasses['studio-topbar']} */ ;
/** @type {__VLS_StyleScopedClasses['topbar-section-title']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            NButton: NButton,
            NDropdown: NDropdown,
            t: t,
            appStore: appStore,
            taskStore: taskStore,
            themeLabel: themeLabel,
            themeOptions: themeOptions,
            langOptions: langOptions,
            handleThemeSelect: handleThemeSelect,
            handleLangSelect: handleLangSelect,
            handlePickFiles: handlePickFiles,
            handleOpenResult: handleOpenResult,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
//# sourceMappingURL=Topbar.vue.js.map
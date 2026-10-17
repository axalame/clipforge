import { defineStore } from "pinia";
import { ref } from "vue";
import { i18n } from "@/locales";
import { showAppNotification } from "@/utils/notification";
export const useTaskStore = defineStore("task", () => {
    const isRunning = ref(false);
    const progressPercent = ref(0);
    const statusText = ref("");
    const currentOperation = ref("");
    const currentPlatform = ref("");
    const metricsText = ref("");
    const latestOutput = ref("");
    const terminalLogs = ref("");
    // Download history
    const loadHistory = () => {
        try {
            const h = localStorage.getItem("yt_download_history");
            return h ? JSON.parse(h) : [];
        }
        catch {
            return [];
        }
    };
    const downloadHistory = ref(loadHistory());
    const saveHistory = () => {
        try {
            localStorage.setItem("yt_download_history", JSON.stringify(downloadHistory.value.slice(0, 100)));
        }
        catch { }
    };
    const addHistoryItem = (item) => {
        downloadHistory.value.unshift(item);
        saveHistory();
    };
    const clearHistory = () => {
        downloadHistory.value = [];
        saveHistory();
    };
    const t = (key, params) => i18n.global.t(key, params);
    // Setup global callbacks from backend
    const initBackendEvents = () => {
        if (typeof window === "undefined")
            return;
        window.onTaskStarted = (d) => {
            isRunning.value = true;
            progressPercent.value = 5;
            latestOutput.value = "";
            currentPlatform.value = d.platform || "";
            const opName = d.platform ? t("download_from", { platform: d.platform }) : (d.operation || "");
            currentOperation.value = opName;
            statusText.value = `${t("status_running_prefix")}${opName}`;
            terminalLogs.value += `[START] ${d.cmd || ""}\n`;
        };
        window.onTaskProgress = (p) => {
            if (p.percent >= 0) {
                progressPercent.value = p.percent;
                if (currentOperation.value) {
                    statusText.value = `${currentOperation.value}: ${p.percent}%`;
                }
                else {
                    statusText.value = `${t("status_processing_prefix")}${p.percent}%`;
                }
            }
            const m = [];
            if (p.speed)
                m.push(`${t("status_speed_prefix")}${p.speed}`);
            if (p.eta)
                m.push(`ETA: ${p.eta}`);
            if (p.size)
                m.push(`${t("status_size_prefix")}${p.size}`);
            metricsText.value = m.join(" • ");
            const activeItem = downloadHistory.value.find((item) => item.status === "downloading");
            if (activeItem) {
                if (p.percent >= 0)
                    activeItem.progress = p.percent;
                if (p.speed)
                    activeItem.speed = p.speed;
                if (p.eta)
                    activeItem.eta = p.eta;
            }
        };
        window.onTaskLog = (l) => {
            const str = typeof l === "object" && l !== null && l.text ? l.text : l;
            let newLogs = terminalLogs.value + str + "\n";
            if (newLogs.length > 250000) {
                newLogs = "... [output truncated] ...\n" + newLogs.slice(-150000);
            }
            terminalLogs.value = newLogs;
        };
        window.onTaskComplete = (d) => {
            isRunning.value = false;
            progressPercent.value = 100;
            currentOperation.value = "";
            currentPlatform.value = "";
            statusText.value = d.message || t("status_success_done");
            metricsText.value = "";
            if (d.output)
                latestOutput.value = d.output;
            const activeItem = downloadHistory.value.find((item) => item.status === "downloading");
            if (activeItem) {
                activeItem.status = "completed";
                activeItem.progress = 100;
                if (d.output)
                    activeItem.outputPath = d.output;
                saveHistory();
                showAppNotification("success", t("notify_download_success") || "Скачивание завершено", activeItem.title || t("notify_video_downloaded") || "Видео успешно сохранено");
            }
            else {
                showAppNotification("success", t("notify_video_ready") || "Видео готово", d.message || t("notify_processing_finished") || "Обработка успешно завершена");
            }
        };
        window.onTaskCancelled = () => {
            isRunning.value = false;
            progressPercent.value = 0;
            currentOperation.value = "";
            currentPlatform.value = "";
            statusText.value = t("status_op_cancelled");
            terminalLogs.value += "\n[CANCELLED BY USER]\n";
            const activeItem = downloadHistory.value.find((item) => item.status === "downloading");
            if (activeItem) {
                activeItem.status = "cancelled";
                saveHistory();
            }
            showAppNotification("warning", t("notify_cancelled") || "Операция отменена", t("notify_cancelled_desc") || "Процесс был остановлен пользователем");
        };
        window.onTaskError = (d) => {
            isRunning.value = false;
            progressPercent.value = 0;
            currentOperation.value = "";
            currentPlatform.value = "";
            statusText.value = t("status_op_failed");
            terminalLogs.value += `\n[ERROR] ${d.error}\n`;
            const activeItem = downloadHistory.value.find((item) => item.status === "downloading");
            if (activeItem) {
                activeItem.status = "failed";
                activeItem.error = d.error || t("status_download_failed");
                saveHistory();
            }
            showAppNotification("error", t("status_op_failed") || "Ошибка выполнения", d.error || t("status_download_failed") || "Произошла ошибка при выполнении");
        };
        window.onBatchFileStart = (d) => {
            statusText.value = `${t("status_batch_item")} (${d.index}/${d.total}): ${d.name}`;
            terminalLogs.value += `\n--- File ${d.index}/${d.total}: ${d.name} ---\n`;
        };
        window.onBatchComplete = (d) => {
            isRunning.value = false;
            progressPercent.value = 100;
            statusText.value = `${t("status_batch_done")} (${d.processed}/${d.total})`;
            terminalLogs.value += `\n[BATCH PROCESSING COMPLETE] Processed: ${d.processed}\n`;
            showAppNotification("success", t("notify_batch_ready") || "Пакетная обработка завершена", t("notify_batch_finished") || "Все файлы успешно обработаны");
        };
    };
    return {
        isRunning,
        progressPercent,
        statusText,
        currentOperation,
        currentPlatform,
        metricsText,
        latestOutput,
        terminalLogs,
        downloadHistory,
        addHistoryItem,
        clearHistory,
        saveHistory,
        initBackendEvents,
        bindWindowCallbacks: initBackendEvents,
        isProcessing: isRunning,
    };
});
//# sourceMappingURL=task.js.map
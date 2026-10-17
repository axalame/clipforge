import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { QueueFileItem, MediaStreamTechSpecs } from "@/types";
import { apiClient } from "@/api/client";

export const useQueueStore = defineStore("queue", () => {
  const fileQueue = ref<QueueFileItem[]>([]);
  const activeFile = ref<QueueFileItem | null>(null);
  const selectedMediaInfo = ref<MediaStreamTechSpecs>({});
  const activeVideoSrc = ref<string>("");
  const activeFrameSrc = ref<string>("");
  const hasVideoError = ref<boolean>(false);
  const isLoadingMediaInfo = ref<boolean>(false);

  const activeFilePath = computed(() => {
    return activeFile.value?.path || "";
  });

  const activeStreamUrl = computed(() => {
    return activeVideoSrc.value;
  });

  const activeTechSpecs = computed(() => {
    return selectedMediaInfo.value;
  });

  const selectedIndex = computed(() => {
    if (!activeFile.value) return -1;
    return fileQueue.value.findIndex((f) => f.path === activeFile.value?.path);
  });

  const activeFileName = computed(() => {
    if (activeFile.value && activeFile.value.name) return activeFile.value.name;
    if (fileQueue.value.length > 0) return fileQueue.value[0].name;
    return "";
  });

  const addFiles = async (paths: string[]) => {
    for (const p of paths) {
      if (!p) continue;
      if (!fileQueue.value.some((f) => f.path === p)) {
        const name = p.split(/[/\\]/).pop() || p;
        fileQueue.value.push({
          id: Math.random().toString(36).substring(2, 9),
          path: p,
          name,
          status: "ready",
        });
      }
    }
    if (!activeFile.value && fileQueue.value.length > 0) {
      selectFile(fileQueue.value[0]);
    }
  };

  const selectFile = async (itemOrPath: QueueFileItem | string) => {
    let item: QueueFileItem | undefined;
    if (typeof itemOrPath === "string") {
      item = fileQueue.value.find((f) => f.path === itemOrPath);
      if (!item) {
        const name = itemOrPath.split(/[/\\]/).pop() || itemOrPath;
        item = {
          id: Math.random().toString(36).substring(2, 9),
          path: itemOrPath,
          name,
          status: "ready",
        };
        fileQueue.value.push(item);
      }
    } else {
      item = itemOrPath;
    }

    activeFile.value = item;
    hasVideoError.value = false;
    const encoded = encodeURIComponent(item.path);
    activeVideoSrc.value = `/video?path=${encoded}`;
    activeFrameSrc.value = `/frame?path=${encoded}&t=0.5`;

    isLoadingMediaInfo.value = true;
    try {
      const info = await apiClient.getMediaInfo(item.path);
      selectedMediaInfo.value = info || {};
    } catch {
      selectedMediaInfo.value = {};
    } finally {
      isLoadingMediaInfo.value = false;
    }
  };

  const setActiveFile = (itemOrPath: QueueFileItem | string) => {
    return selectFile(itemOrPath);
  };

  const removeFile = (idOrPath: string) => {
    const idx = fileQueue.value.findIndex((f) => f.id === idOrPath || f.path === idOrPath);
    if (idx !== -1) {
      const target = fileQueue.value[idx];
      const wasActive = activeFile.value && (activeFile.value.id === target.id || activeFile.value.path === target.path);
      fileQueue.value.splice(idx, 1);
      if (wasActive) {
        activeFile.value = fileQueue.value.length > 0 ? fileQueue.value[0] : null;
        if (activeFile.value) {
          selectFile(activeFile.value);
        } else {
          activeVideoSrc.value = "";
          activeFrameSrc.value = "";
          selectedMediaInfo.value = {};
        }
      }
    }
  };

  const clearQueue = () => {
    fileQueue.value = [];
    activeFile.value = null;
    activeVideoSrc.value = "";
    activeFrameSrc.value = "";
    selectedMediaInfo.value = {};
  };

  return {
    fileQueue,
    activeFile,
    activeFilePath,
    activeStreamUrl,
    activeTechSpecs,
    selectedMediaInfo,
    activeVideoSrc,
    activeFrameSrc,
    hasVideoError,
    activeFileName,
    selectedIndex,
    isLoadingMediaInfo,
    addFiles,
    selectFile,
    setActiveFile,
    removeFile,
    clearQueue,
  };
});

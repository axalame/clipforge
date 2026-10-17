import { defineStore } from "pinia";
import { ref } from "vue";
import type { AppConfig } from "@/types";
import { apiClient } from "@/api/client";

export const useConfigStore = defineStore("config", () => {
  const config = ref<AppConfig>({
    ffmpeg_path: "ffmpeg",
    ffprobe_path: "ffprobe",
    ytdlp_path: "yt-dlp",
    deno_path: "deno",
    output_dir: "downloads",
    cookies_file: "",
    ytdlp_channel: "stable",
  });

  const toolStatuses = ref({
    ytdlp: { ok: false, version: "", path: "", checking: false },
    deno: { ok: false, version: "", path: "", checking: false },
    ffmpeg: { ok: false, version: "", path: "", checking: false },
  });

  const fetchConfig = async () => {
    try {
      const res: any = await apiClient.getConfig();
      if (res) {
        config.value = {
          ffmpeg_path: res.ffmpeg_dir || res.ffmpeg_path || "ffmpeg",
          ffprobe_path: res.ffprobe_path || "ffprobe",
          ytdlp_path: res.ytdlp_path || "yt-dlp",
          deno_path: res.deno_path || "deno",
          output_dir: res.output_dir || "downloads",
          cookies_file: res.cookie_file || res.cookies_file || "",
          ytdlp_channel: res.ytdlp_channel || "stable",
        };

        if (res.tools) {
          if (res.tools.ffmpeg) {
            toolStatuses.value.ffmpeg.ok = !!res.tools.ffmpeg.ok;
            toolStatuses.value.ffmpeg.version = res.tools.ffmpeg.version || "";
            toolStatuses.value.ffmpeg.path = res.tools.ffmpeg.path || "";
          }
          if (res.tools.ytdlp) {
            toolStatuses.value.ytdlp.ok = !!res.tools.ytdlp.ok;
            toolStatuses.value.ytdlp.version = res.tools.ytdlp.version || "";
            toolStatuses.value.ytdlp.path = res.tools.ytdlp.path || "";
          }
          if (res.tools.deno) {
            toolStatuses.value.deno.ok = !!res.tools.deno.ok;
            toolStatuses.value.deno.version = res.tools.deno.version || "";
            toolStatuses.value.deno.path = res.tools.deno.path || "";
          }
        }
      }
    } catch {}
  };

  const saveConfig = async (partial?: Partial<AppConfig>) => {
    if (partial) {
      config.value = { ...config.value, ...partial };
    }
    const payload = {
      ffmpeg_dir: config.value.ffmpeg_path,
      ytdlp_path: config.value.ytdlp_path,
      deno_path: config.value.deno_path,
      output_dir: config.value.output_dir,
      cookie_file: config.value.cookies_file,
      ytdlp_channel: config.value.ytdlp_channel,
    };
    const res = await apiClient.saveConfig(payload);
    await fetchConfig();
    return res;
  };

  const checkComponent = async (name: "ytdlp" | "deno" | "ffmpeg") => {
    toolStatuses.value[name].checking = true;
    try {
      if (name === "ytdlp") {
        const res = await apiClient.updateYtdlp();
        return res;
      } else if (name === "deno") {
        const res = await apiClient.checkDenoUpdate();
        return res;
      } else {
        const res = await apiClient.checkFfmpegUpdate();
        return res;
      }
    } catch (e: any) {
      return { ok: false, msg: String(e) };
    } finally {
      toolStatuses.value[name].checking = false;
    }
  };

  const checkAllComponents = async () => {
    await fetchConfig();
  };

  return {
    config,
    toolStatuses,
    fetchConfig,
    loadConfig: fetchConfig,
    saveConfig,
    checkComponent,
    checkAllComponents,
  };
});

import type { AppConfig, MediaStreamTechSpecs, YtVideoMetadata } from "@/types";

declare global {
  interface Window {
    pywebview?: {
      api: {
        get_config: () => Promise<AppConfig>;
        save_config: (cfg: any) => Promise<any>;
        select_files: () => Promise<string[]>;
        select_watermark_file: () => Promise<string | null>;
        select_audio_file: () => Promise<string | null>;
        select_cookies_file: () => Promise<string | null>;
        select_folder: () => Promise<string | null>;
        get_media_info: (path: string) => Promise<MediaStreamTechSpecs>;
        preview_file: (path: string) => Promise<any>;
        open_in_explorer: (path: string) => Promise<any>;
        delete_file: (path: string) => Promise<any>;
        start_operation: (op: string, file: string, params: any) => Promise<any>;
        start_batch: (op: string, files: any, params: any) => Promise<any>;
        start_download: (params: any) => Promise<any>;
        analyze_url: (params: any) => Promise<YtVideoMetadata>;
        update_ytdlp: () => Promise<any>;
        check_deno_update: () => Promise<any>;
        check_ffmpeg_update: () => Promise<any>;
        download_tool: (name: string) => Promise<any>;
        cancel: () => Promise<any>;
        [key: string]: any;
      };
    };
  }
}

class ApiClient {
  private get rawApi() {
    if (typeof window !== "undefined" && window.pywebview && window.pywebview.api) {
      return window.pywebview.api;
    }
    return null;
  }

  async getConfig(): Promise<AppConfig> {
    if (!this.rawApi) {
      return {
        ffmpeg_path: "ffmpeg",
        ffprobe_path: "ffprobe",
        ytdlp_path: "yt-dlp",
        deno_path: "deno",
        output_dir: "downloads",
        cookies_file: "",
      };
    }
    return this.rawApi.get_config();
  }

  async saveConfig(cfg: any): Promise<any> {
    if (!this.rawApi) return { ok: false };
    return this.rawApi.save_config(cfg);
  }

  async selectFiles(): Promise<string[]> {
    if (!this.rawApi) return [];
    return this.rawApi.select_files();
  }

  async selectWatermarkFile(): Promise<string | null> {
    if (!this.rawApi) return null;
    return this.rawApi.select_watermark_file();
  }

  async selectAudioFile(): Promise<string | null> {
    if (!this.rawApi) return null;
    return this.rawApi.select_audio_file();
  }

  async selectCookiesFile(): Promise<string | null> {
    if (!this.rawApi) return null;
    return this.rawApi.select_cookies_file();
  }

  async selectFolder(): Promise<string | null> {
    if (!this.rawApi) return null;
    return this.rawApi.select_folder();
  }

  async getMediaInfo(filePath: string): Promise<MediaStreamTechSpecs> {
    if (!this.rawApi) return {};
    return this.rawApi.get_media_info(filePath);
  }

  async previewFile(path: string): Promise<any> {
    if (!this.rawApi) return;
    return this.rawApi.preview_file(path);
  }

  async openInExplorer(path: string): Promise<any> {
    if (!this.rawApi) return;
    return this.rawApi.open_in_explorer(path);
  }

  async deleteFile(path: string): Promise<any> {
    if (!this.rawApi) return { ok: false };
    return this.rawApi.delete_file(path);
  }

  async startOperation(op: string, file: string, params: any): Promise<any> {
    if (!this.rawApi) return { error: "Native API unavailable" };
    return this.rawApi.start_operation(op, file, params);
  }

  async startBatch(op: string, files: any[], params: any): Promise<any> {
    if (!this.rawApi) return { error: "Native API unavailable" };
    return this.rawApi.start_batch(op, files, params);
  }

  async startDownload(params: any): Promise<any> {
    if (!this.rawApi) return { error: "Native API unavailable" };
    return this.rawApi.start_download(params);
  }

  async analyzeUrl(urlOrParams: string | Record<string, any>, cookie_source = "file", cookie_file = ""): Promise<YtVideoMetadata> {
    const params = typeof urlOrParams === "string"
      ? { url: urlOrParams, cookie_source, cookie_file }
      : urlOrParams;
    if (!this.rawApi) return { ok: false, title: "", error: "Native API unavailable" };
    return this.rawApi.analyze_url(params);
  }

  async updateYtdlp(): Promise<any> {
    if (!this.rawApi) return { ok: false, msg: "Native API unavailable" };
    return this.rawApi.update_ytdlp();
  }

  async checkDenoUpdate(): Promise<any> {
    if (!this.rawApi) return { ok: false, msg: "Native API unavailable" };
    return this.rawApi.check_deno_update();
  }

  async checkFfmpegUpdate(): Promise<any> {
    if (!this.rawApi) return { ok: false, msg: "Native API unavailable" };
    return this.rawApi.check_ffmpeg_update();
  }

  async cancel(): Promise<any> {
    if (!this.rawApi) return { ok: false };
    return this.rawApi.cancel();
  }

  // Aliases for compatibility
  async pickFiles(): Promise<string[]> {
    return this.selectFiles();
  }

  async pickFile(_filterPattern?: string): Promise<string | null> {
    return this.selectCookiesFile();
  }

  async pickFolder(): Promise<string | null> {
    return this.selectFolder();
  }

  async openPath(path: string): Promise<any> {
    return this.openInExplorer(path);
  }

  async openInPlayer(path: string): Promise<any> {
    return this.previewFile(path);
  }

  async cancelProcess(): Promise<any> {
    return this.cancel();
  }

  async downloadUrl(params: any): Promise<any> {
    return this.startDownload(params);
  }

  async checkComponent(name: string): Promise<any> {
    if (name === "ytdlp") return this.updateYtdlp();
    if (name === "deno") return this.checkDenoUpdate();
    return this.checkFfmpegUpdate();
  }

  async checkAppUpdate(): Promise<any> {
    if (!this.rawApi) return { ok: false, msg: "API недоступно" };
    return this.rawApi.check_app_update();
  }

  async installAppUpdate(downloadUrl: string): Promise<any> {
    if (!this.rawApi) return { ok: false, msg: "API недоступно" };
    return this.rawApi.install_app_update(downloadUrl);
  }

  async downloadTool(name: string): Promise<any> {
    if (!this.rawApi) return { ok: false, msg: "Native API unavailable" };
    return this.rawApi.download_tool(name);
  }
}

export const apiClient = new ApiClient();
export const api = apiClient;

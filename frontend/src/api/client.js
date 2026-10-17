class ApiClient {
    get rawApi() {
        if (typeof window !== "undefined" && window.pywebview && window.pywebview.api) {
            return window.pywebview.api;
        }
        return null;
    }
    async getConfig() {
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
    async saveConfig(cfg) {
        if (!this.rawApi)
            return { ok: false };
        return this.rawApi.save_config(cfg);
    }
    async selectFiles() {
        if (!this.rawApi)
            return [];
        return this.rawApi.select_files();
    }
    async selectWatermarkFile() {
        if (!this.rawApi)
            return null;
        return this.rawApi.select_watermark_file();
    }
    async selectAudioFile() {
        if (!this.rawApi)
            return null;
        return this.rawApi.select_audio_file();
    }
    async selectCookiesFile() {
        if (!this.rawApi)
            return null;
        return this.rawApi.select_cookies_file();
    }
    async selectFolder() {
        if (!this.rawApi)
            return null;
        return this.rawApi.select_folder();
    }
    async getMediaInfo(filePath) {
        if (!this.rawApi)
            return {};
        return this.rawApi.get_media_info(filePath);
    }
    async previewFile(path) {
        if (!this.rawApi)
            return;
        return this.rawApi.preview_file(path);
    }
    async openInExplorer(path) {
        if (!this.rawApi)
            return;
        return this.rawApi.open_in_explorer(path);
    }
    async deleteFile(path) {
        if (!this.rawApi)
            return { ok: false };
        return this.rawApi.delete_file(path);
    }
    async startOperation(op, file, params) {
        if (!this.rawApi)
            return { error: "Native API unavailable" };
        return this.rawApi.start_operation(op, file, params);
    }
    async startBatch(op, files, params) {
        if (!this.rawApi)
            return { error: "Native API unavailable" };
        return this.rawApi.start_batch(op, files, params);
    }
    async startDownload(params) {
        if (!this.rawApi)
            return { error: "Native API unavailable" };
        return this.rawApi.start_download(params);
    }
    async analyzeUrl(urlOrParams, cookie_source = "file", cookie_file = "") {
        const params = typeof urlOrParams === "string"
            ? { url: urlOrParams, cookie_source, cookie_file }
            : urlOrParams;
        if (!this.rawApi)
            return { ok: false, title: "", error: "Native API unavailable" };
        return this.rawApi.analyze_url(params);
    }
    async updateYtdlp() {
        if (!this.rawApi)
            return { ok: false, msg: "Native API unavailable" };
        return this.rawApi.update_ytdlp();
    }
    async checkDenoUpdate() {
        if (!this.rawApi)
            return { ok: false, msg: "Native API unavailable" };
        return this.rawApi.check_deno_update();
    }
    async checkFfmpegUpdate() {
        if (!this.rawApi)
            return { ok: false, msg: "Native API unavailable" };
        return this.rawApi.check_ffmpeg_update();
    }
    async cancel() {
        if (!this.rawApi)
            return { ok: false };
        return this.rawApi.cancel();
    }
    // Aliases for compatibility
    async pickFiles() {
        return this.selectFiles();
    }
    async pickFile(_filterPattern) {
        return this.selectCookiesFile();
    }
    async pickFolder() {
        return this.selectFolder();
    }
    async openPath(path) {
        return this.openInExplorer(path);
    }
    async openInPlayer(path) {
        return this.previewFile(path);
    }
    async cancelProcess() {
        return this.cancel();
    }
    async downloadUrl(params) {
        return this.startDownload(params);
    }
    async checkComponent(name) {
        if (name === "ytdlp")
            return this.updateYtdlp();
        if (name === "deno")
            return this.checkDenoUpdate();
        return this.checkFfmpegUpdate();
    }
}
export const apiClient = new ApiClient();
export const api = apiClient;
//# sourceMappingURL=client.js.map
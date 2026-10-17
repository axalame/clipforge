export type StudioNav =
  | "download"
  | "trim"
  | "geometry"
  | "effects"
  | "audio"
  | "export"
  | "media"
  | "settings";

export type ThemeMode = "system" | "dark" | "light";

export interface MediaStreamTechSpecs {
  width?: number;
  height?: number;
  video_codec?: string;
  fps?: number;
  duration?: number;
  duration_str?: string;
  audio_codec?: string;
  bitrate_kbps?: number;
  bitrate?: number;
  size_mb?: number;
  size?: number;
  format_name?: string;
  [key: string]: any;
}

export interface QueueFileItem {
  id: string;
  path: string;
  name: string;
  size_mb?: number;
  duration?: number;
  status?: "ready" | "processing" | "done" | "error";
  progress?: number;
  error?: string;
}

export interface YtVideoFormat {
  format_id: string;
  height?: number;
  resolution?: string;
  ext?: string;
  fps?: number;
  vcodec?: string;
  acodec?: string;
  filesize_approx?: number;
  size_mb?: number;
  tbr?: number;
  asr?: number;
  is_video?: boolean;
  is_audio?: boolean;
}

export interface YtVideoMetadata {
  ok: boolean;
  title: string;
  thumbnail?: string;
  duration?: string;
  resolution?: string;
  uploader?: string;
  view_count?: number;
  video_formats?: YtVideoFormat[];
  audio_formats?: YtVideoFormat[];
  error?: string;
}

export interface DownloadHistoryItem {
  id: string;
  url: string;
  title: string;
  thumbnail?: string;
  format?: string;
  size?: string;
  duration?: string | number;
  resolution?: string;
  container?: string;
  date?: string;
  outputPath?: string;
  status: "downloading" | "completed" | "cancelled" | "failed";
  progress: number;
  speed?: string;
  eta?: string;
  error?: string;
  timestamp?: number;
  [key: string]: any;
}

export interface AppConfig {
  ffmpeg_path?: string;
  ffprobe_path?: string;
  ytdlp_path?: string;
  deno_path?: string;
  output_dir?: string;
  cookies_file?: string;
  ytdlp_channel?: string;
  [key: string]: any;
}

export interface TaskProgressPayload {
  percent: number;
  speed?: string;
  eta?: string;
  size?: string;
}

export interface TaskLogPayload {
  text: string;
}

export interface TaskCompletePayload {
  output?: string;
  message?: string;
}

export interface TaskErrorPayload {
  error: string;
}

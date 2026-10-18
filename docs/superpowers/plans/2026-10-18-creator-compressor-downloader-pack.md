# Implementation Plan: Social Shorts Adapter, Fit-to-Size Compressor & Downloader Upgrades

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three high-value capabilities in ClipForge: (1) 9:16 Shorts/Reels Smart-Blur adapter for social media, (2) Fit-to-Size compressor for messaging limits (Discord 25MB, Telegram 50MB) + animated WebP export, and (3) Downloader enhancements with standalone subtitle download and chapter splitting.

**Architecture:** Extend `src/ffmpeg_builder.rs` with `smart_blur_9_16`, target size bitrate auto-calculation, and WebP animation; update `src/ytdlp_runner.rs` with `--write-subs` and `--split-chapters`; integrate user-friendly controls in `GeometryView.vue`, `ExportView.vue`, and `DownloaderView.vue` with full i18n support.

**Tech Stack:** Rust (tiny_http, wry, tao), FFmpeg complex filters (`boxblur`, `palettegen`, `libwebp`), yt-dlp, Vue 3, Naive UI, Pinia, TypeScript.

---

## Global Constraints
- Strict deployment policy: No git push, no GitHub tags or releases without explicit user command (`залей`, `деплой`).
- Local-first verification: Test using fast frontend builds (`npm run fast-build`) and `fast-test.bat`.
- Zero secrets in source code.

## Review Focus
- Division by zero in Fit-to-Size bitrate calculation when video duration is 0 or missing (must guard with sensible fallback).
- Windows path escaping in FFmpeg complex filter graphs for Smart Blur.
- Downloader handling when a video does not have chapters or subtitles (yt-dlp should continue gracefully without crashing).
- Memory and CPU usage during 2-pass/complex filter rendering.
- i18n key consistency between `ru-RU` and `en-US`.

---

### Task 1: 9:16 Shorts/Reels Smart-Blur Adapter

**Files:**
- Modify: `src/ffmpeg_builder.rs:490-540`
- Modify: `frontend/src/views/GeometryView.vue:1-250`
- Modify: `frontend/src/locales/ru-RU/geometry.json`
- Modify: `frontend/src/locales/en-US/geometry.json`
- Test: `src/ffmpeg_builder.rs` (unit tests)

**Interfaces:**
- Operation: `"smart_blur_9_16"`
- Params: `{ blur: number (10-50, default 20), target_width: 1080, target_height: 1920 }`
- Complex filter: `[0:v]scale={w}:{h}:force_original_aspect_ratio=increase,crop={w}:{h},boxblur={b}:5[bg];[0:v]scale={w}:{h}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[outv]`

- [ ] **Step 1: Write unit test in `src/ffmpeg_builder.rs` for `smart_blur_9_16`**
- [ ] **Step 2: Run `cargo test test_smart_blur_9_16` and verify failure**
- [ ] **Step 3: Implement `smart_blur_9_16` command builder in `src/ffmpeg_builder.rs`**
- [ ] **Step 4: Run `cargo test test_smart_blur_9_16` and verify pass**
- [ ] **Step 5: Add `shorts` subtab and controls in `frontend/src/views/GeometryView.vue`**
- [ ] **Step 6: Add localization strings in `geometry.json` for ru-RU and en-US**

---

### Task 2: Fit-to-Size Compressor & WebP Animation

**Files:**
- Modify: `src/ffmpeg_builder.rs:615-720`
- Modify: `frontend/src/views/ExportView.vue:1-150`
- Modify: `frontend/src/locales/ru-RU/export.json`
- Modify: `frontend/src/locales/en-US/export.json`
- Test: `src/ffmpeg_builder.rs` (unit tests)

**Interfaces:**
- Compress with target size: `params: { target_size_mb: number, duration: number, codec: string, preset: string }`
- Calculated video bitrate: `target_bits = target_size_mb * 8 * 1024 * 1024 * 0.95; video_kbps = ((target_bits / duration) - 128_000) / 1000`
- Format WebP animation: `create_gif` with `params: { format: "webp", start: number, duration: number, quality: string }`

- [ ] **Step 1: Write unit tests in `src/ffmpeg_builder.rs` for target-size compression and animated webp**
- [ ] **Step 2: Run `cargo test test_compress_fit_to_size` and verify failure**
- [ ] **Step 3: Implement target-size bitrate logic and webp output in `src/ffmpeg_builder.rs`**
- [ ] **Step 4: Run `cargo test` and verify pass**
- [ ] **Step 5: Add Fit-to-Size presets (10MB, 25MB, 50MB, 100MB) and WebP toggle in `frontend/src/views/ExportView.vue`**
- [ ] **Step 6: Add localization strings in `export.json` for ru-RU and en-US**

---

### Task 3: Downloader Upgrades (Subtitles & Chapters)

**Files:**
- Modify: `src/ytdlp_runner.rs:350-410`
- Modify: `frontend/src/views/DownloaderView.vue:205-230, 480-550`
- Modify: `frontend/src/locales/ru-RU/home.json`
- Modify: `frontend/src/locales/en-US/home.json`
- Test: `src/ytdlp_runner.rs` (unit tests)

**Interfaces:**
- Downloader params: `write_subs: bool`, `sub_langs: string ("ru,en.*,all")`, `split_chapters: bool`
- Args added to command:
  - If `write_subs`: `["--write-subs", "--write-auto-subs", "--sub-format", "srt/best", "--convert-subs", "srt"]`
  - If `split_chapters`: `["--split-chapters"]`

- [ ] **Step 1: Write unit tests in `src/ytdlp_runner.rs` for `write_subs` and `split_chapters`**
- [ ] **Step 2: Run `cargo test test_build_ytdlp_command_subs_and_chapters` and verify failure**
- [ ] **Step 3: Implement subtitle and chapter flags in `src/ytdlp_runner.rs`**
- [ ] **Step 4: Run `cargo test test_build_ytdlp_command_subs_and_chapters` and verify pass**
- [ ] **Step 5: Add checkboxes in `DownloaderView.vue` and bind to download payload**
- [ ] **Step 6: Add localization strings in `home.json` for ru-RU and en-US**

---

### Task 4: Verification and Quality Gate

- [ ] **Step 1: Run full Rust test suite (`cargo test`)**
- [ ] **Step 2: Run frontend fast build (`npx vite build --emptyOutDir`)**
- [ ] **Step 3: Verify clean workspace and commit-readiness (no secrets, no broken imports)**

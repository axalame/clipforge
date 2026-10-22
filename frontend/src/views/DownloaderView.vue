<template>
  <div style="display:flex; flex-direction:column; gap:16px;">
    <!-- Top-Centered Navigation Bar (Matching tset / yt-dlp-gui) -->
    <div class="yt-nav-header">
      <div class="yt-header-tabs">
        <div class="yt-header-tab" :class="{ 'is-active': ytSubNav === 'download' }" @click="ytSubNav = 'download'">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          <span>{{ t('tab_download') }}</span>
        </div>
        <div class="yt-header-tab" :class="{ 'is-active': ytSubNav === 'pending' }" @click="ytSubNav = 'pending'">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>{{ t('tab_pending') }}</span>
          <span v-if="pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
        </div>
        <div class="yt-header-tab" :class="{ 'is-active': ytSubNav === 'history' }" @click="ytSubNav = 'history'">
          <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span>{{ t('tab_history') }}</span>
          <span v-if="taskStore.downloadHistory.length > 0" class="tab-badge">{{ taskStore.downloadHistory.length }}</span>
        </div>
      </div>
    </div>

    <!-- 1.1 TAB: DOWNLOAD (URL Input & Config) -->
    <div v-show="ytSubNav === 'download'" class="yt-tab-pane">
      <!-- STEP 1: BEFORE URL ANALYSIS -->
      <div v-if="!ytVideoMeta" class="yt-welcome-container">
        <div v-if="configStore.hasMissingRequiredTools" class="yt-missing-tools-alert" style="margin-bottom:12px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="#f59e0b" stroke-width="2" fill="none">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>{{ t('missing_tools_warning', 'Не установлены модули yt-dlp, FFmpeg или Deno JS.') }}</span>
          </div>
          <n-button size="small" type="primary" secondary @click="appStore.activeNav = 'settings'">
            {{ t('install_in_settings', 'Скачать в настройках ⚙️') }}
          </n-button>
        </div>
        <div class="yt-welcome-title">{{ t('welcome_title') }}</div>

        <div class="yt-mode-pills">
          <div class="yt-pill" :class="{ 'is-active': ytDownloadType === 'single' }" @click="ytDownloadType = 'single'">{{ t('mode_single') }}</div>
          <div class="yt-pill" :class="{ 'is-active': ytDownloadType === 'batch' }" @click="ytDownloadType = 'batch'">{{ t('mode_batch') }}</div>
        </div>

        <!-- Single Mode Input -->
        <div v-if="ytDownloadType === 'single'" class="yt-search-box">
          <n-input
            v-model:value="ytUrl"
            :placeholder="t('placeholder_url')"
            size="large"
            round
            clearable
            @keydown.enter="handleAnalyze"
            class="yt-pill-input"
          >
            <template #prefix>
              <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:4px; opacity:0.6;">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </template>
          </n-input>
        </div>

        <!-- Batch Mode Input -->
        <div v-else class="yt-batch-box">
          <n-input
            v-model:value="ytUrl"
            type="textarea"
            :placeholder="t('placeholder_batch')"
            :autosize="{ minRows: 2, maxRows: 5 }"
            class="yt-batch-input"
          />
        </div>

        <!-- Under input action bar -->
        <div class="yt-quick-actions">
          <div class="yt-quick-left">
            <n-button secondary round size="small" @click="handlePickCookies" :title="t('select_cookies')">
              <template #icon>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 8v4l3 3"></path>
                </svg>
              </template>
              Cookies: {{ configStore.config.cookies_file ? t('cookies_connected') : t('cookies_not_set') }}
            </n-button>
          </div>
          <div class="yt-quick-right">
            <n-button type="primary" round size="medium" :loading="isAnalyzing" @click="handleAnalyze" style="padding:0 24px;">
              <template #icon>
                <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2.2" fill="none">
                  <circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </template>
              {{ t('analyze') }}
            </n-button>
          </div>
        </div>

        <!-- Bottom helper buttons -->
        <div class="yt-center-tools">
          <n-button secondary round size="medium" @click="handlePasteUrl">
            <template #icon>
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
            </template>
            {{ t('paste') }}
          </n-button>
          <n-button secondary round size="medium" @click="appStore.activeNav = 'settings'">
            <template #icon>
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </template>
            {{ t('nav_settings') }}
          </n-button>
        </div>
      </div>

      <!-- STEP 2: AFTER URL ANALYSIS -->
      <div v-else class="yt-analyzed-container">
        <!-- Top bar with URL and reset/refresh button -->
        <div class="yt-url-bar">
          <n-input v-model:value="ytUrl" placeholder="URL" round size="medium" @keydown.enter="handleAnalyze">
            <template #suffix>
              <n-button quaternary circle size="small" :loading="isAnalyzing" @click="handleAnalyze" :title="t('refresh')">
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </n-button>
            </template>
          </n-input>
          <n-button secondary round size="medium" @click="resetAnalysis">{{ t('new_url') }}</n-button>
        </div>

        <!-- Video card with preview, title and author -->
        <div class="yt-card yt-meta-header">
          <div class="yt-thumb-wrapper">
            <img :src="ytVideoMeta.thumbnail" class="yt-thumb-img" alt="Thumbnail" />
            <span class="yt-duration-badge">{{ ytVideoMeta.duration || '00:00' }}</span>
          </div>
          <div class="yt-meta-info">
            <div class="yt-video-title" :title="ytVideoMeta.title">{{ ytVideoMeta.title }}</div>
            <div class="yt-channel-row">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>{{ ytVideoMeta.uploader || t('channel_unknown') }}</span>
            </div>
            <div class="yt-views-row">
              <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>
              </svg>
              <span>{{ formatViews(ytVideoMeta.view_count) }}</span>
            </div>
          </div>
        </div>

        <!-- Download method (mode tabs) -->
        <div class="yt-card">
          <div class="yt-section-label">{{ t('download_method') }}</div>
          <div class="yt-mode-selector">
            <button class="yt-mode-btn" :class="{ 'is-selected': downloadMode === 'default' }" @click="downloadMode = 'default'">{{ t('method_default') }}</button>
            <button class="yt-mode-btn" :class="{ 'is-selected': downloadMode === 'video_only' }" @click="downloadMode = 'video_only'">{{ t('method_video_only') }}</button>
            <button class="yt-mode-btn" :class="{ 'is-selected': downloadMode === 'audio_only' }" @click="downloadMode = 'audio_only'">{{ t('method_audio_only') }}</button>
          </div>

          <!-- Stream selection for video and audio -->
          <div style="display:flex; flex-direction:column; gap:12px; margin-top:14px;">
            <div v-if="downloadMode === 'default' || downloadMode === 'video_only'" class="form-field">
              <label class="field-label">{{ t('label_video') }}</label>
              <n-select v-model:value="selectedVideoFormatId" :options="videoFormatSelectOptions" :placeholder="t('placeholder_video')" />
            </div>

            <div v-if="downloadMode === 'default' || downloadMode === 'audio_only'" class="form-field">
              <label class="field-label">{{ t('label_audio') }}</label>
              <n-select v-model:value="selectedAudioFormatId" :options="audioFormatSelectOptions" :placeholder="t('placeholder_audio')" />
            </div>
          </div>
        </div>

        <!-- Additional parameters -->
        <div class="yt-card">
          <div class="yt-section-label">{{ t('extra_params') }}</div>
          <div class="form-grid-2" style="margin-bottom:12px;">
            <div class="form-field">
              <label class="field-label">{{ t('file_container') }}</label>
              <n-select v-model:value="ytContainer" :options="containerOptions" />
            </div>
            <div class="form-field">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                <label class="field-label" style="margin-bottom:0;">{{ t('time_trim') }}</label>
                <n-switch v-model:value="ytEnableTrim" size="small">
                  <template #checked>{{ t('trim_fragment') }}</template>
                  <template #unchecked>{{ t('trim_full') }}</template>
                </n-switch>
              </div>
              <n-flex :size="6" align="center" v-if="ytEnableTrim">
                <n-input v-model:value="ytTrimStart" placeholder="00:00:00" style="flex:1;" />
                <span style="color:var(--text-sub);">—</span>
                <n-input v-model:value="ytTrimEnd" placeholder="00:00:00" style="flex:1;" />
              </n-flex>
              <div v-else style="font-size:12px; color:var(--accent); padding:4px 0; display:flex; align-items:center; gap:6px;">
                <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                <span>{{ t('direct_stream_tip') }}</span>
              </div>
            </div>
          </div>

          <!-- Advanced options checkboxes -->
          <div class="yt-checkbox-grid">
            <n-checkbox v-model:checked="ytEmbedMeta">{{ t('embed_meta') }}</n-checkbox>
            <n-checkbox v-model:checked="ytEmbedSubs">{{ t('embed_subs') }}</n-checkbox>
            <n-checkbox v-model:checked="ytWriteSubs">{{ t('write_subs') }}</n-checkbox>
            <n-checkbox v-model:checked="ytSplitChapters">{{ t('split_chapters') }}</n-checkbox>
            <n-checkbox v-model:checked="ytEmbedThumb">{{ t('embed_thumb') }}</n-checkbox>
            <n-checkbox v-model:checked="ytSponsorblock">{{ t('sponsorblock') }}</n-checkbox>
          </div>

          <!-- Subtitle Language selector when subtitles are enabled -->
          <div v-if="ytEmbedSubs || ytWriteSubs" style="margin-top:12px; padding:10px 14px; background:rgba(255,255,255,0.02); border:1px solid var(--border-color); border-radius:10px; display:flex; align-items:center; justify-content:space-between; gap:12px;">
            <div style="font-size:12px; color:var(--text-sub); display:flex; align-items:center; gap:8px;">
              <svg viewBox="0 0 24 24" width="15" height="15" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 15h4M15 15h2M7 11h2M13 11h4"/></svg>
              <span>{{ t('sub_langs_label') }}</span>
            </div>
            <n-select v-model:value="ytSubLang" :options="subLangOptions" size="small" style="width:230px;" />
          </div>

          <!-- Cookies status -->
          <div style="margin-top:14px; padding-top:12px; border-top:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
            <div style="font-size:12px; color:var(--text-muted); display:flex; align-items:center; gap:8px;">
              <span>{{ t('auth_cookies') }}</span>
              <n-tag size="tiny" :type="configStore.config.cookies_file ? 'success' : 'default'">
                {{ configStore.config.cookies_file ? t('cookies_file_ok') : t('cookies_not_specified') }}
              </n-tag>
            </div>
            <n-button size="tiny" secondary @click="appStore.activeNav = 'settings'">{{ t('change_in_settings') }}</n-button>
          </div>
        </div>

        <!-- Save directory -->
        <div class="yt-card">
          <div class="yt-section-label">{{ t('download_folder') }}</div>
          <n-flex align="center" :size="8">
            <n-input v-model:value="configStore.config.output_dir" placeholder="downloads" style="flex:1;" />
            <n-button secondary @click="handlePickOutputDir">
              <template #icon>
                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                </svg>
              </template>
              {{ t('browse') }}
            </n-button>
          </n-flex>
        </div>

        <!-- Bottom bar with size calculation and Download button -->
        <div class="yt-bottom-bar">
          <div class="yt-size-label">
            <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <span>{{ t('approx_size') }} <b>{{ calculatedSizeText }}</b></span>
          </div>
          <n-button type="primary" size="large" :loading="taskStore.isRunning" @click="handleDownload" class="yt-download-btn">
            <template #icon>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </template>
            {{ t('download_now') }}
          </n-button>
        </div>
      </div>
    </div>

    <!-- 1.2 TAB: PENDING (Active tasks) -->
    <div v-show="ytSubNav === 'pending'" class="yt-tab-pane">
      <div v-if="pendingTasks.length === 0" class="history-empty-view">
        <div class="empty-icon-box">
          <svg viewBox="0 0 24 24" width="30" height="30" stroke="currentColor" stroke-width="1.8" fill="none">
            <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <div class="empty-label">{{ t('no_active_tasks') }}</div>
        <div style="font-size:12px; color:var(--text-sub);">{{ t('empty_tasks_sub') }}</div>
      </div>

      <div v-else class="history-list">
        <div v-for="item in pendingTasks" :key="item.id" class="history-card">
          <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
            <div style="position:relative; width:80px; height:50px; flex-shrink:0;">
              <img v-if="item.thumbnail" :src="item.thumbnail" class="history-thumb" style="width:100%; height:100%;" />
              <div v-else style="width:100%; height:100%; border-radius:6px; background:#1e293b; display:flex; align-items:center; justify-content:center; color:var(--text-sub);">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <span v-if="item.duration" style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.75); color:#fff; font-size:10px; padding:1px 4px; border-radius:3px; font-weight:600;">{{ item.duration }}</span>
            </div>

            <div class="history-info">
              <div class="history-title" :title="item.title">{{ item.title }}</div>
              <div class="history-meta">
                <n-tag size="tiny" type="warning">
                  {{ t('status_downloading') }} ({{ item.progress }}%)
                </n-tag>
                <span v-if="item.speed">{{ item.speed }}</span>
                <span v-if="item.eta">• ETA: {{ item.eta }}</span>
                <span>• {{ item.resolution }} • {{ (item.container || 'MP4').toUpperCase() }}</span>
              </div>
              <n-progress type="line" :percentage="item.progress" processing status="success" style="height:4px; margin-top:6px;" />
            </div>
          </div>

          <div class="history-actions">
            <n-button size="small" type="error" secondary @click="cancelTask">
              {{ t('stop') }}
            </n-button>
            <n-button size="tiny" quaternary circle @click="copyToClipboard(item.url)" :title="t('copy_link')">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </n-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 1.3 TAB: HISTORY -->
    <div v-show="ytSubNav === 'history'" class="yt-tab-pane">
      <!-- Filter Sub-Tabs Bar (Matching Screenshot) -->
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border-color); padding-bottom:2px;">
        <div class="history-filter-bar" style="border-bottom:none; margin-bottom:0; flex:1;">
          <div class="history-filter-item" :class="{ 'is-active': historyFilter === 'all' }" @click="historyFilter = 'all'">
            {{ t('filter_all') }}
          </div>
          <div class="history-filter-item" :class="{ 'is-active': historyFilter === 'downloading' }" @click="historyFilter = 'downloading'">
            {{ t('filter_downloading') }}
          </div>
          <div class="history-filter-item" :class="{ 'is-active': historyFilter === 'completed' }" @click="historyFilter = 'completed'">
            {{ t('filter_completed') }}
          </div>
          <div class="history-filter-item" :class="{ 'is-active': historyFilter === 'cancelled' }" @click="historyFilter = 'cancelled'">
            {{ t('filter_cancelled') }}
          </div>
          <div class="history-filter-item" :class="{ 'is-active': historyFilter === 'failed' }" @click="historyFilter = 'failed'">
            {{ t('filter_failed') }}
          </div>
        </div>

        <n-button v-if="taskStore.downloadHistory.length > 0" size="tiny" secondary @click="clearHistory" style="margin-left:12px; margin-right:8px;">
          <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none" style="margin-right:4px;"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          {{ t('clear_history') }}
        </n-button>
      </div>

      <!-- Empty State (Matching Screenshot) -->
      <div v-if="filteredHistory.length === 0" class="history-empty-view">
        <div class="empty-icon-box">
          <svg viewBox="0 0 24 24" width="32" height="32" stroke="currentColor" stroke-width="1.6" fill="none">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <div class="empty-label">{{ historyEmptyTitle }}</div>
        <div style="font-size:12px; color:var(--text-sub);">{{ t('empty_tasks_sub') }}</div>
      </div>

      <!-- History List Cards -->
      <div v-else class="history-list">
        <div v-for="item in filteredHistory" :key="item.id" class="history-card">
          <div style="display:flex; align-items:center; gap:12px; min-width:0; flex:1;">
            <div style="position:relative; width:80px; height:50px; flex-shrink:0;">
              <img v-if="item.thumbnail" :src="item.thumbnail" class="history-thumb" style="width:100%; height:100%;" />
              <div v-else style="width:100%; height:100%; border-radius:6px; background:#1e293b; display:flex; align-items:center; justify-content:center; color:var(--text-sub);">
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </div>
              <span v-if="item.duration" style="position:absolute; bottom:2px; right:2px; background:rgba(0,0,0,0.75); color:#fff; font-size:10px; padding:1px 4px; border-radius:3px; font-weight:600;">{{ item.duration }}</span>
            </div>

            <div class="history-info">
              <div class="history-title" :title="item.title">{{ item.title }}</div>
              <div class="history-meta">
                <n-tag size="tiny" :type="item.status === 'completed' ? 'success' : (item.status === 'downloading' ? 'warning' : (item.status === 'failed' ? 'error' : 'default'))">
                  {{ item.status === 'completed' ? t('status_completed') : (item.status === 'downloading' ? (t('status_downloading') + ' (' + item.progress + '%)') : (item.status === 'failed' ? t('status_failed') : t('status_cancelled'))) }}
                </n-tag>
                <span>{{ item.resolution }}</span>
                <span>•</span>
                <span style="text-transform:uppercase;">{{ item.container }}</span>
                <span>•</span>
                <span>{{ item.date }}</span>
              </div>
              <n-progress v-if="item.status === 'downloading'" type="line" :percentage="item.progress" processing status="success" style="height:3px; margin-top:4px;" />
            </div>
          </div>

          <div class="history-actions">
            <n-button v-if="item.status === 'completed'" size="tiny" secondary @click="openHistoryFile(item)" :title="t('open_file')">
              <template #icon>
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </template>
              {{ t('open_file') }}
            </n-button>
            <n-button v-if="item.status === 'completed'" size="tiny" secondary @click="openHistoryFolder(item)" :title="t('open_folder')">
              <template #icon>
                <svg viewBox="0 0 24 24" width="12" height="12" stroke="currentColor" stroke-width="2" fill="none"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </template>
              {{ t('open_folder') }}
            </n-button>
            <n-button v-if="item.status === 'downloading'" size="tiny" type="error" secondary @click="cancelTask">
              {{ t('stop') }}
            </n-button>
            <n-button size="tiny" quaternary circle @click="copyToClipboard(item.url)" :title="t('copy_link')">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            </n-button>
            <n-button size="tiny" quaternary circle @click="removeHistoryItem(item)" :title="t('delete')" style="color:var(--text-sub);">
              <svg viewBox="0 0 24 24" width="13" height="13" stroke="currentColor" stroke-width="2" fill="none"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </n-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import {
  NInput,
  NButton,
  NSelect,
  NSwitch,
  NCheckbox,
  NTag,
  NProgress,
  NFlex,
  useMessage,
} from "naive-ui";
import { useAppStore } from "@/stores/app";
import { useConfigStore } from "@/stores/config";
import { useTaskStore } from "@/stores/task";
import { apiClient } from "@/api/client";
import { showAppNotification } from "@/utils/notification";
import type { YtVideoMetadata, DownloadHistoryItem } from "@/types";

const { t } = useI18n();
const message = useMessage();
const appStore = useAppStore();
const configStore = useConfigStore();
const taskStore = useTaskStore();

const ytSubNav = ref<"download" | "pending" | "history">("download");
const ytDownloadType = ref<"single" | "batch">("single");
const ytUrl = ref("");
const isAnalyzing = ref(false);
const ytVideoMeta = ref<YtVideoMetadata | null>(null);

const downloadMode = ref<"default" | "video_only" | "audio_only">("default");
const selectedVideoFormatId = ref<string>("");
const selectedAudioFormatId = ref<string>("");
const ytContainer = ref<string>("mp4");
const ytEnableTrim = ref<boolean>(false);
const ytTrimStart = ref<string>("00:00:00");
const ytTrimEnd = ref<string>("");
const ytEmbedMeta = ref<boolean>(true);
const ytEmbedSubs = ref<boolean>(false);
const ytWriteSubs = ref<boolean>(false);
const ytSplitChapters = ref<boolean>(false);
const ytEmbedThumb = ref<boolean>(true);
const ytSponsorblock = ref<boolean>(false);
const ytSubLang = ref<string>("ru,en");
const historyFilter = ref<string>("all");

const subLangOptions = computed(() => [
  { label: t("sub_lang_ru") || "Русский (ru)", value: "ru" },
  { label: t("sub_lang_en") || "English (en)", value: "en" },
  { label: t("sub_lang_ru_en") || "Русский + English (ru,en)", value: "ru,en" },
]);

const containerOptions = [
  { label: "MP4 (H.264 / AAC)", value: "mp4" },
  { label: "MKV (Matroska Multimedia)", value: "mkv" },
  { label: "WEBM (VP9 / Opus)", value: "webm" },
  { label: "MP3 (Audio Only)", value: "mp3" },
];

const videoFormatSelectOptions = computed(() => {
  if (!ytVideoMeta.value?.video_formats) return [];
  return ytVideoMeta.value.video_formats.map((f: any) => ({
    label: f.label || `${f.resolution || "Unknown"} (${f.ext})`,
    value: f.format_id,
  }));
});

const audioFormatSelectOptions = computed(() => {
  if (!ytVideoMeta.value?.audio_formats) return [];
  return ytVideoMeta.value.audio_formats.map((f: any) => ({
    label: f.label || `${f.format_id} (${f.ext})`,
    value: f.format_id,
  }));
});

const calculatedSizeText = computed(() => {
  if (!ytVideoMeta.value) return "—";
  let total = 0;
  if (downloadMode.value === "default" || downloadMode.value === "video_only") {
    const vf = (ytVideoMeta.value.video_formats || []).find(
      (f: any) => f.format_id === selectedVideoFormatId.value
    );
    if (vf && vf.size_mb) total += vf.size_mb;
  }
  if (downloadMode.value === "default" || downloadMode.value === "audio_only") {
    const af = (ytVideoMeta.value.audio_formats || []).find(
      (f: any) => f.format_id === selectedAudioFormatId.value
    );
    if (af && af.size_mb) total += af.size_mb;
  }
  return total > 0 ? `${(Math.round(total * 10) / 10).toFixed(1)} MB` : "—";
});

const pendingTasks = computed(() => {
  return taskStore.downloadHistory.filter((i) => i.status === "downloading");
});

const pendingCount = computed(() => pendingTasks.value.length);

const filteredHistory = computed(() => {
  if (historyFilter.value === "all") return taskStore.downloadHistory;
  return taskStore.downloadHistory.filter((i) => i.status === historyFilter.value);
});

const historyEmptyTitle = computed(() => {
  if (historyFilter.value === "all") return t("history_empty_all");
  if (historyFilter.value === "completed") return t("empty_tasks");
  if (historyFilter.value === "downloading") return t("no_active_tasks");
  if (historyFilter.value === "cancelled") return t("no_cancelled_tasks");
  if (historyFilter.value === "failed") return t("no_failed_tasks");
  return t("history_empty_filter");
});

const formatViews = (n?: number) => {
  if (!n) return appStore.currentLang === "en" ? "0 views" : "0 просмотров";
  if (appStore.currentLang === "en") {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M views";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K views";
    return n + " views";
  }
  if (n >= 1000000) return (n / 1000000).toFixed(1) + " млн. просмотров";
  if (n >= 1000) return (n / 1000).toFixed(1) + " тыс. просмотров";
  return n + " просмотров";
};

const handlePickCookies = async () => {
  const f = await apiClient.pickFile();
  if (f) {
    configStore.config.cookies_file = f;
    await apiClient.saveConfig({ cookies_file: f });
    message.success(t("msg_cookies_saved"));
  }
};

const handlePickOutputDir = async () => {
  const d = await apiClient.pickFolder();
  if (d) {
    configStore.config.output_dir = d;
  }
};

const handlePasteUrl = async () => {
  try {
    const text = await navigator.clipboard.readText();
    if (text && text.trim().startsWith("http")) {
      ytUrl.value = text.trim();
      message.success(t("msg_url_pasted"));
      handleAnalyze();
    } else if (text) {
      ytUrl.value = text.trim();
    }
  } catch {
    message.info(t("msg_paste_hint"));
  }
};

const resetAnalysis = () => {
  ytVideoMeta.value = null;
  ytUrl.value = "";
  ytEnableTrim.value = false;
};

const handleAnalyze = async () => {
  const raw = ytUrl.value.trim();
  if (!raw) {
    message.warning(t("msg_enter_url"));
    return;
  }
  const urls = raw.split(/\r?\n/).map((u) => u.trim()).filter((u) => u.length > 0);
  const targetUrl = urls[0];
  if (!targetUrl) {
    message.warning(t("msg_enter_url"));
    return;
  }
  isAnalyzing.value = true;
  try {
    const res = await apiClient.analyzeUrl({
      url: targetUrl,
      cookie_file: configStore.config.cookies_file,
    });
    if (res && res.ok) {
      ytVideoMeta.value = res;
      if (res.video_formats && res.video_formats.length > 0) {
        selectedVideoFormatId.value = res.video_formats[0].format_id;
      }
      if (res.audio_formats && res.audio_formats.length > 0) {
        selectedAudioFormatId.value = res.audio_formats[0].format_id;
      }
      ytTrimStart.value = "00:00:00";
      ytTrimEnd.value = res.duration || "";
      ytEnableTrim.value = false;
      message.success(t("msg_analyze_success"));
    } else {
      const err = res?.error || t("err_fetch_formats");
      message.error(err);
    }
  } catch (err: any) {
    message.error(t("msg_analyze_fail") + err);
  } finally {
    isAnalyzing.value = false;
  }
};

const handleDownload = async () => {
  const targetUrl = ytUrl.value.trim();
  if (!targetUrl) {
    message.warning(t("msg_enter_url"));
    return;
  }

  let formatId = "";
  if (downloadMode.value === "default") {
    if (selectedVideoFormatId.value && selectedAudioFormatId.value) {
      formatId = `${selectedVideoFormatId.value}+${selectedAudioFormatId.value}`;
    } else if (selectedVideoFormatId.value) {
      formatId = selectedVideoFormatId.value;
    }
  } else if (downloadMode.value === "video_only") {
    formatId = selectedVideoFormatId.value;
  } else if (downloadMode.value === "audio_only") {
    formatId = selectedAudioFormatId.value;
  }

  let selectedHeight = 0;
  if (selectedVideoFormatId.value && ytVideoMeta.value?.video_formats) {
    const vf = ytVideoMeta.value.video_formats.find((f: any) => f.format_id === selectedVideoFormatId.value);
    if (vf && vf.height) {
      selectedHeight = vf.height;
    }
  }

  const params = {
    url: targetUrl,
    format_id: formatId || undefined,
    height: selectedHeight > 0 ? selectedHeight : undefined,
    extract_audio: downloadMode.value === "audio_only",
    format: ytContainer.value || "mp4",
    start_time: ytEnableTrim.value ? ytTrimStart.value.trim() : "",
    end_time: ytEnableTrim.value ? ytTrimEnd.value.trim() : "",
    cookie_file: configStore.config.cookies_file,
    output_dir: configStore.config.output_dir || undefined,
    embed_subs: ytEmbedSubs.value,
    write_subs: ytWriteSubs.value,
    sub_langs: ytSubLang.value,
    split_chapters: ytSplitChapters.value,
    embed_thumbnail: ytEmbedThumb.value,
    embed_metadata: ytEmbedMeta.value,
    sponsorblock: ytSponsorblock.value,
  };

  const historyId = Date.now() + "_" + Math.random().toString(36).substring(2, 7);
  const newItem: DownloadHistoryItem = {
    id: historyId,
    url: targetUrl,
    title: ytVideoMeta.value?.title || targetUrl,
    thumbnail: ytVideoMeta.value?.thumbnail || "",
    duration: ytVideoMeta.value?.duration || "",
    resolution: downloadMode.value === "audio_only" ? "Audio" : (ytVideoMeta.value?.resolution || "1080p"),
    container: ytContainer.value || "mp4",
    status: "downloading",
    progress: 5,
    speed: "",
    eta: "",
    date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    outputPath: "",
  };

  taskStore.addHistoryItem(newItem);
  taskStore.terminalLogs = "";
  await apiClient.downloadUrl(params);
};

const cancelTask = async () => {
  const activeItem = taskStore.downloadHistory.find((item) => item.status === "downloading");
  if (activeItem) {
    activeItem.status = "cancelled";
    taskStore.saveHistory();
  }
  await apiClient.cancel();
  showAppNotification(
    "warning",
    t("notify_download_cancelled") || "Загрузка отменена",
    t("notify_download_cancelled_desc") || "Загрузка видео остановлена"
  );
};

const copyToClipboard = async (text?: string) => {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success(t("msg_copied"));
  } catch {
    message.info(text);
  }
};

const openHistoryFile = (item: DownloadHistoryItem) => {
  if (item.outputPath) {
    apiClient.openPath(item.outputPath);
  }
};

const openHistoryFolder = (item: DownloadHistoryItem) => {
  if (item.outputPath) {
    apiClient.openPath(item.outputPath);
  } else if (configStore.config.output_dir) {
    apiClient.openPath(configStore.config.output_dir);
  }
};

const removeHistoryItem = async (item: DownloadHistoryItem) => {
  let targetPath = item.outputPath;
  const isDir = !targetPath || targetPath === configStore.config.output_dir || targetPath.endsWith("/") || targetPath.endsWith("\\");
  if (isDir) {
    targetPath = configStore.config.output_dir
      ? `${configStore.config.output_dir}/${item.title}.${item.container || 'mp4'}`
      : `${item.title}.${item.container || 'mp4'}`;
  }

  if (targetPath) {
    try {
      const res = await apiClient.deleteFile(targetPath);
      if ((!res || !res.ok) && item.title) {
        await apiClient.deleteFile(item.title);
      }
    } catch (e) {
      console.warn("Failed to delete file from disk:", e);
    }
  }
  taskStore.downloadHistory = taskStore.downloadHistory.filter((i) => i.id !== item.id);
  taskStore.saveHistory();
  message.success(t("msg_deleted_history_file") || "Файл и запись удалены");
};

const clearHistory = () => {
  taskStore.clearHistory();
};
</script>

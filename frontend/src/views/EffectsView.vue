<template>
  <div style="display:flex; flex-direction:column; gap:16px;">
    <div class="studio-subtabs">
      <button class="subtab-btn" :class="{ 'is-active': subFx === 'watermark' }" @click="subFx = 'watermark'">{{ t('sub_fx_watermark') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subFx === 'text' }" @click="subFx = 'text'">{{ t('sub_fx_text') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subFx === 'timestamp' }" @click="subFx = 'timestamp'">{{ t('sub_fx_timestamp') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subFx === 'blur' }" @click="subFx = 'blur'">{{ t('sub_fx_blur') }}</button>
      <button class="subtab-btn" :class="{ 'is-active': subFx === 'pip' }" @click="subFx = 'pip'">{{ t('sub_fx_pip') }}</button>
    </div>

    <!-- LIVE INTERACTIVE VISUAL CANVAS -->
    <div class="interactive-stage-card">
      <div class="stage-header">
        <div style="display:flex; align-items:center; gap:8px;">
          <span class="stage-title">{{ t('fx_interactive_title') }}</span>
          <n-tag size="tiny" type="success" round>{{ t('fx_interactive_tag') }}</n-tag>
        </div>
        <div style="font-size:11px; color:var(--text-sub);">
          <span v-if="subFx === 'watermark'">{{ t('fx_hint_wm') }}</span>
          <span v-else-if="subFx === 'blur'">{{ t('fx_hint_blur') }}</span>
          <span v-else-if="subFx === 'text'">{{ t('fx_hint_text') }}</span>
          <span v-else-if="subFx === 'timestamp'">{{ t('fx_hint_ts') }}</span>
          <span v-else-if="subFx === 'pip'">{{ t('fx_hint_pip') }}</span>
        </div>
      </div>

      <!-- Interactive Viewport Stage (Dynamic Aspect Canvas) -->
      <div class="stage-outer-wrapper">
        <div
          class="interactive-viewport"
          :style="viewportStyle"
          ref="stageRef"
          @mousedown="onStageMouseDown"
        >
          <!-- Live Video Frame if loaded -->
          <video
            v-show="queueStore.activeVideoSrc && !queueStore.hasVideoError"
            id="interactive-canvas-video"
            :src="queueStore.activeVideoSrc"
            :poster="queueStore.activeFrameSrc"
            class="stage-video"
            playsinline
            muted
            loop
            @error="onVideoError"
          ></video>

          <img
            v-if="queueStore.activeFrameSrc && queueStore.hasVideoError"
            :src="queueStore.activeFrameSrc"
            class="stage-video"
            style="position:absolute; inset:0; width:100%; height:100%; object-fit:contain; pointer-events:none;"
          />

          <!-- Background Grid Pattern if no video -->
          <div v-if="!queueStore.activeVideoSrc" class="stage-placeholder-grid">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="position:absolute; inset:0;">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
            <div class="placeholder-hint">
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="1.8" fill="none" style="flex-shrink:0;">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>{{ t('fx_stage_placeholder') }}</span>
            </div>
          </div>

          <!-- 1. Watermark Draggable Box -->
          <div
            v-if="subFx === 'watermark'"
            class="stage-overlay-item is-watermark"
            :style="wmBoxStyle"
            @mousedown.stop="onStartDragWatermark"
            :title="t('drag_logo_tip')"
          >
            <img v-if="activeWatermarkSrc" :src="activeWatermarkSrc" class="stage-wm-img" @load="onWatermarkImgLoad" />
            <div v-else class="stage-wm-dummy">
              <span>{{ t('logo_watermark_text') }}</span>
            </div>
            <div class="stage-item-badge">X: {{ wmForm.x_pct }}% | Y: {{ wmForm.y_pct }}%</div>
          </div>

          <!-- 2. Text Overlay Draggable Box -->
          <div
            v-if="subFx === 'text'"
            class="stage-overlay-item is-text"
            :style="{
              left: textForm.x_pct + '%',
              top: textForm.y_pct + '%',
              transform: 'translate(-50%, -50%)',
              color: textForm.color,
              fontSize: Math.max(12, Math.round(textForm.fontsize / 2.2)) + 'px',
              background: textForm.use_box ? 'rgba(0, 0, 0, 0.65)' : 'transparent',
              textShadow: textForm.use_box ? 'none' : '0 0 3px #000, 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
              border: textForm.use_box ? '1px solid rgba(255,255,255,0.2)' : '1.5px dashed var(--accent)',
              whiteSpace: 'nowrap',
              minWidth: 'max-content',
              padding: '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }"
            @mousedown.stop="onStartDragText"
            :title="t('drag_text_tip')"
          >
            <span style="white-space:nowrap; font-weight:600;">{{ textForm.text || t('default_text_content') }}</span>
            <div class="stage-item-badge">X: {{ textForm.x_pct }}% | Y: {{ textForm.y_pct }}%</div>
          </div>

          <!-- 3. Timestamp Draggable Box -->
          <div
            v-if="subFx === 'timestamp'"
            class="stage-overlay-item is-text"
            :style="{
              left: tsForm.x_pct + '%',
              top: tsForm.y_pct + '%',
              transform: 'translate(-50%, -50%)',
              color: tsForm.color,
              fontSize: Math.max(11, Math.round(tsForm.fontsize / 2.2)) + 'px',
              background: tsForm.use_box ? 'rgba(0, 0, 0, 0.65)' : 'transparent',
              textShadow: tsForm.use_box ? 'none' : '0 0 3px #000, 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000',
              border: tsForm.use_box ? '1px solid rgba(255,255,255,0.2)' : '1.5px dashed var(--accent)',
              whiteSpace: 'nowrap',
              minWidth: 'max-content',
              padding: '4px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }"
            @mousedown.stop="onStartDragTimestamp"
            :title="t('drag_timecode_tip')"
          >
            <span style="white-space:nowrap; font-family:Consolas, monospace; font-weight:600;">{{ liveFormattedTimestamp || '2026-10-17 00:00:00' }}</span>
            <div class="stage-item-badge">X: {{ tsForm.x_pct }}% | Y: {{ tsForm.y_pct }}%</div>
          </div>

          <!-- 4. Blur / Censorship Selection Box -->
          <div
            v-if="subFx === 'blur'"
            class="stage-overlay-item is-blur"
            :style="blurBoxStyle"
            @mousedown.stop="onStartMoveBlur"
            :title="t('drag_blur_tip')"
          >
            <div class="stage-blur-badge" :style="{ color: blurForm.effect === 'pixelate' ? '#f59e0b' : '#38bdf8', borderColor: blurForm.effect === 'pixelate' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(56, 189, 248, 0.4)' }">
              {{ blurForm.effect === 'pixelate' ? t('pixelate_prefix') + ' ' + Math.max(4, Math.round(blurForm.intensity / 4)) + 'px' : t('blur_prefix') + ' R=' + Math.max(2, Math.round(blurForm.intensity / 3.5)) + 'px' }}
              ({{ blurForm.w }}×{{ blurForm.h }} px)
            </div>
            <div class="handle-br" @mousedown.stop="onStartResizeBlur"></div>
          </div>

          <!-- 5. PIP Draggable Box -->
          <div
            v-if="subFx === 'pip'"
            class="stage-overlay-item is-pip"
            :style="{
              left: pipForm.x_pct + '%',
              top: pipForm.y_pct + '%',
              width: pipForm.scale + '%',
              transform: 'translate(-50%, -50%)'
            }"
            @mousedown.stop="onStartDragPip"
            :title="t('drag_pip_tip')"
          >
            <div class="pip-inner">
              <span>{{ t('pip_overlay_label') }}</span>
            </div>
            <div class="stage-item-badge">{{ pipForm.scale }}% (X: {{ pipForm.x_pct }}%, Y: {{ pipForm.y_pct }}%)</div>
          </div>

          <!-- Play / Pause video button on canvas if active video -->
          <div v-if="queueStore.activeVideoSrc" class="stage-video-toolbar">
            <button class="stage-play-btn" @click.stop="toggleStagePlayback" :title="t('play_pause_tooltip')">
              <svg v-if="!isStagePlaying" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                <rect x="6" y="4" width="4" height="16"/>
                <rect x="14" y="4" width="4" height="16"/>
              </svg>
            </button>
            <span class="stage-timecode">{{ t('preview_badge') }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Watermark Form -->
    <div v-if="subFx === 'watermark'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('wm_params_title') }}</span>
        <n-tag v-if="wmForm.position === 'custom'" size="small" type="primary" round>
          {{ t('position_coord') }} X: {{ wmForm.x_pct }}%, Y: {{ wmForm.y_pct }}%
        </n-tag>
        <n-tag v-else size="small" type="info" round>
          {{ t('preset_label') }} {{ wmForm.position }}
        </n-tag>
      </div>

      <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('wm_file_label') }}</label>
          <n-flex align="center" :size="8">
            <n-input v-model:value="wmForm.path" :placeholder="t('choose_file')" style="flex:1;" />
            <n-button secondary @click="pickWatermark">{{ t('browse') }}</n-button>
          </n-flex>
        </div>

        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">{{ t('opacity_label') }} {{ wmForm.opacity }}%</label>
            <n-slider v-model:value="wmForm.opacity" :min="10" :max="100" />
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('logo_size_label') }} {{ wmForm.size }}%</label>
            <n-slider v-model:value="wmForm.size" :min="5" :max="80" />
          </div>
        </div>

        <div class="form-field">
          <label class="field-label">{{ t('quick_presets_corner') }}</label>
          <div class="grid-3x3">
            <div class="grid-cell" :class="{ 'is-selected': wmForm.position === 'top-left' }" @click="setWmPreset('top-left')">TL</div>
            <div class="grid-cell" :class="{ 'is-selected': wmForm.position === 'top-center' }" @click="setWmPreset('top-center')">TC</div>
            <div class="grid-cell" :class="{ 'is-selected': wmForm.position === 'top-right' }" @click="setWmPreset('top-right')">TR</div>
            <div class="grid-cell" :class="{ 'is-selected': wmForm.position === 'center-left' }" @click="setWmPreset('center-left')">CL</div>
            <div class="grid-cell" :class="{ 'is-selected': wmForm.position === 'center' }" @click="setWmPreset('center')">C</div>
            <div class="grid-cell" :class="{ 'is-selected': wmForm.position === 'center-right' }" @click="setWmPreset('center-right')">CR</div>
            <div class="grid-cell" :class="{ 'is-selected': wmForm.position === 'bottom-left' }" @click="setWmPreset('bottom-left')">BL</div>
            <div class="grid-cell" :class="{ 'is-selected': wmForm.position === 'bottom-center' }" @click="setWmPreset('bottom-center')">BC</div>
            <div class="grid-cell" :class="{ 'is-selected': wmForm.position === 'bottom-right' }" @click="setWmPreset('bottom-right')">BR</div>
          </div>
        </div>
      </div>
      <n-flex :size="10">
        <n-button type="primary" @click="runOp('add_watermark')">{{ t('btn_wm_file') }}</n-button>
        <n-button secondary @click="runBatch('add_watermark')">{{ t('btn_speed_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- Text Overlay Form -->
    <div v-if="subFx === 'text'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('text_params_title') }}</span>
        <n-tag v-if="textForm.position === 'custom'" size="small" type="primary" round>
          {{ t('position_coord') }} X: {{ textForm.x_pct }}%, Y: {{ textForm.y_pct }}%
        </n-tag>
      </div>
      <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('text_content_label') }}</label>
          <n-input v-model:value="textForm.text" :placeholder="t('text_placeholder')" />
        </div>
        <div class="form-grid-2">
          <div class="form-field">
            <label class="field-label">{{ t('font_size_label') }} {{ textForm.fontsize }}</label>
            <div style="display:flex; gap:10px; align-items:center;">
              <n-slider v-model:value="textForm.fontsize" :min="12" :max="140" :step="1" style="flex:1;" />
              <n-input-number v-model:value="textForm.fontsize" :min="12" :max="200" style="width:90px;" />
            </div>
          </div>
          <div class="form-field">
            <label class="field-label">{{ t('text_color_label') }}</label>
            <n-color-picker v-model:value="textForm.color" :show-alpha="false" style="width:100%;" />
            <div style="display:flex; gap:6px; margin-top:6px; align-items:center;">
              <div
                v-for="c in colorPresets"
                :key="c"
                @click="textForm.color = c"
                :style="{
                  background: c,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  border: textForm.color === c ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.25)',
                  boxSizing: 'border-box'
                }"
                :title="c"
              ></div>
            </div>
          </div>
        </div>
        <div class="form-field" style="margin-bottom:12px; background:var(--bg-panel-subtle); padding:10px 14px; border-radius:6px; border:1px solid var(--border-color);">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div>
              <div style="font-size:13px; font-weight:600; color:var(--text-main);">{{ t('box_bg_title') }}</div>
              <div style="font-size:11px; color:var(--text-sub); margin-top:2px;">{{ t('box_bg_desc_text') }}</div>
            </div>
            <n-switch v-model:value="textForm.use_box" size="small">
              <template #checked>{{ t('sw_on') }}</template>
              <template #unchecked>{{ t('sw_off') }}</template>
            </n-switch>
          </div>
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('quick_presets_corner') }}</label>
          <div class="grid-3x3">
            <div class="grid-cell" :class="{ 'is-selected': textForm.position === 'top-left' }" @click="setTextPreset('top-left')">TL</div>
            <div class="grid-cell" :class="{ 'is-selected': textForm.position === 'top-center' }" @click="setTextPreset('top-center')">TC</div>
            <div class="grid-cell" :class="{ 'is-selected': textForm.position === 'top-right' }" @click="setTextPreset('top-right')">TR</div>
            <div class="grid-cell" :class="{ 'is-selected': textForm.position === 'center-left' }" @click="setTextPreset('center-left')">CL</div>
            <div class="grid-cell" :class="{ 'is-selected': textForm.position === 'center' }" @click="setTextPreset('center')">C</div>
            <div class="grid-cell" :class="{ 'is-selected': textForm.position === 'center-right' }" @click="setTextPreset('center-right')">CR</div>
            <div class="grid-cell" :class="{ 'is-selected': textForm.position === 'bottom-left' }" @click="setTextPreset('bottom-left')">BL</div>
            <div class="grid-cell" :class="{ 'is-selected': textForm.position === 'bottom-center' }" @click="setTextPreset('bottom-center')">BC</div>
            <div class="grid-cell" :class="{ 'is-selected': textForm.position === 'bottom-right' }" @click="setTextPreset('bottom-right')">BR</div>
          </div>
        </div>
      </div>
      <n-flex :size="10">
        <n-button type="primary" @click="runOp('add_text_overlay')">{{ t('btn_text_file') }}</n-button>
        <n-button secondary @click="runBatch('add_text_overlay')">{{ t('btn_speed_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- Timestamp Form -->
    <div v-if="subFx === 'timestamp'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('ts_title') }}</span>
        <n-tag size="small" type="success" round>{{ liveFormattedTimestamp }}</n-tag>
      </div>
      <div class="form-grid-2" style="margin-bottom:14px;">
        <div class="form-field">
          <label class="field-label">{{ t('ts_format_label') }}</label>
          <n-input v-model:value="tsForm.format" placeholder="%Y-%m-%d %H:%M:%S" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('font_size_label') }} {{ tsForm.fontsize }}</label>
          <div style="display:flex; gap:10px; align-items:center;">
            <n-slider v-model:value="tsForm.fontsize" :min="10" :max="120" :step="1" style="flex:1;" />
            <n-input-number v-model:value="tsForm.fontsize" :min="10" :max="160" style="width:90px;" />
          </div>
        </div>
        <div class="form-field" style="grid-column: span 2;">
          <label class="field-label">{{ t('ts_color_label') }}</label>
          <n-color-picker v-model:value="tsForm.color" :show-alpha="false" style="width:100%;" />
          <div style="display:flex; gap:6px; margin-top:6px; align-items:center;">
            <div
              v-for="c in colorPresets"
              :key="c"
              @click="tsForm.color = c"
              :style="{
                background: c,
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                cursor: 'pointer',
                border: tsForm.color === c ? '2px solid #34d399' : '1px solid rgba(255,255,255,0.25)',
                boxSizing: 'border-box'
              }"
              :title="c"
            ></div>
          </div>
        </div>
      </div>

      <div class="form-field" style="margin-bottom:12px; background:var(--bg-panel-subtle); padding:10px 14px; border-radius:6px; border:1px solid var(--border-color);">
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div>
            <div style="font-size:13px; font-weight:600; color:var(--text-main);">{{ t('box_bg_title') }}</div>
            <div style="font-size:11px; color:var(--text-sub); margin-top:2px;">{{ t('box_bg_desc_ts') }}</div>
          </div>
          <n-switch v-model:value="tsForm.use_box" size="small">
            <template #checked>{{ t('sw_on') }}</template>
            <template #unchecked>{{ t('sw_off') }}</template>
          </n-switch>
        </div>
      </div>

      <!-- Preset Formats and Live Preview -->
      <div class="form-field" style="margin-bottom:16px; background:var(--bg-panel-subtle); padding:12px; border-radius:6px; border:1px solid var(--border-color);">
        <label class="field-label">{{ t('ts_presets_title') }}</label>
        <div style="display:flex; gap:6px; flex-wrap:wrap; margin-top:4px;">
          <n-button size="tiny" secondary @click="tsForm.format = '%Y-%m-%d %H:%M:%S'">{{ t('ts_p_datetime_iso') }}</n-button>
          <n-button size="tiny" secondary @click="tsForm.format = '%d.%m.%Y %H:%M:%S'">{{ t('ts_p_datetime_eur') }}</n-button>
          <n-button size="tiny" secondary @click="tsForm.format = '%H:%M:%S'">{{ t('ts_p_time') }}</n-button>
          <n-button size="tiny" secondary @click="tsForm.format = '%d.%m.%Y'">{{ t('ts_p_date') }}</n-button>
          <n-button size="tiny" secondary @click="tsForm.format = '%{pts:hms}'">{{ t('ts_p_vid') }}</n-button>
        </div>
        <div style="margin-top:10px; font-size:12px; display:flex; align-items:center; gap:8px;">
          <span style="color:var(--text-sub);">{{ t('live_ts_preview') }}</span>
          <b style="color:#34d399; font-family:Consolas, monospace; font-size:13px;">{{ liveFormattedTimestamp || '2026-10-17 00:00:00' }}</b>
        </div>
      </div>

      <n-flex :size="10">
        <n-button type="primary" @click="runOp('add_timestamp')">{{ t('btn_ts_file') }}</n-button>
        <n-button secondary @click="runBatch('add_timestamp')">{{ t('btn_speed_queue') }}</n-button>
      </n-flex>
    </div>

    <!-- Blur Form -->
    <div v-if="subFx === 'blur'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('blur_title') }}</span>
        <n-tag size="small" type="info" round>
          {{ t('selected_zone') }} {{ blurForm.w }}×{{ blurForm.h }} px (X: {{ blurForm.x }}, Y: {{ blurForm.y }})
        </n-tag>
      </div>
      <div style="display:flex; gap:10px; margin-bottom:14px;">
        <n-button :secondary="blurForm.effect !== 'blur'" :type="blurForm.effect === 'blur' ? 'primary' : 'default'" @click="blurForm.effect = 'blur'">{{ t('blur_box') }}</n-button>
        <n-button :secondary="blurForm.effect !== 'pixelate'" :type="blurForm.effect === 'pixelate' ? 'primary' : 'default'" @click="blurForm.effect = 'pixelate'">{{ t('blur_pixelate') }}</n-button>
      </div>
      <div class="form-grid-2" style="margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('zone_x') }} {{ blurForm.x }}px</label>
          <n-input-number v-model:value="blurForm.x" :min="0" style="width:100%;" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('zone_y') }} {{ blurForm.y }}px</label>
          <n-input-number v-model:value="blurForm.y" :min="0" style="width:100%;" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('zone_w') }} {{ blurForm.w }}px</label>
          <n-input-number v-model:value="blurForm.w" :min="16" style="width:100%;" />
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('zone_h') }} {{ blurForm.h }}px</label>
          <n-input-number v-model:value="blurForm.h" :min="16" style="width:100%;" />
        </div>
        <div class="form-field" style="grid-column: span 2;">
          <label class="field-label">{{ t('zone_intensity') }} {{ blurForm.intensity }}%</label>
          <n-slider v-model:value="blurForm.intensity" :min="10" :max="100" />
        </div>
      </div>
      <n-button type="primary" @click="runOp('blur_video')">{{ t('btn_blur_file') }}</n-button>
    </div>

    <!-- PIP Form -->
    <div v-if="subFx === 'pip'" class="studio-panel">
      <div class="panel-header">
        <span>{{ t('pip_title') }}</span>
      </div>
      <div style="display:flex; flex-direction:column; gap:14px; margin-bottom:16px;">
        <div class="form-field">
          <label class="field-label">{{ t('pip_file_label') }}</label>
          <n-flex align="center" :size="8">
            <n-input v-model:value="pipForm.path" :placeholder="t('pip_file_placeholder')" style="flex:1;" />
            <n-button secondary @click="pickPip">{{ t('browse') }}</n-button>
          </n-flex>
        </div>
        <div class="form-field">
          <label class="field-label">{{ t('pip_scale_label') }} {{ pipForm.scale }}%</label>
          <n-slider v-model:value="pipForm.scale" :min="10" :max="80" />
        </div>
      </div>
      <n-button type="primary" @click="runOp('overlay')">{{ t('btn_pip_file') }}</n-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated } from "vue";
import { useI18n } from "vue-i18n";
import {
  NButton,
  NSlider,
  NInput,
  NInputNumber,
  NTag,
  NFlex,
  NSwitch,
  NColorPicker,
  useMessage,
} from "naive-ui";
import { useQueueStore } from "@/stores/queue";
import { useConfigStore } from "@/stores/config";
import { apiClient } from "@/api/client";

const { t } = useI18n();
const message = useMessage();
const queueStore = useQueueStore();
const configStore = useConfigStore();

const subFx = ref<"watermark" | "text" | "timestamp" | "blur" | "pip">("watermark");

const colorPresets = ["#ffffff", "#facc15", "#ef4444", "#10b981", "#38bdf8", "#a855f7", "#000000"];

const currentClock = ref(new Date());
let clockTimer: any = null;

const liveFormattedTimestamp = computed(() => {
  const d = currentClock.value || new Date();
  const fmt = tsForm.value?.format || "%Y-%m-%d %H:%M:%S";
  if (fmt.includes("pts") || fmt.includes("hms")) {
    return "00:00:00.00";
  }
  const Y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const H = String(d.getHours()).padStart(2, "0");
  const M = String(d.getMinutes()).padStart(2, "0");
  const S = String(d.getSeconds()).padStart(2, "0");

  return fmt
    .replace(/%Y/g, String(Y))
    .replace(/%m/g, m)
    .replace(/%d/g, day)
    .replace(/%H/g, H)
    .replace(/%M/g, M)
    .replace(/%S/g, S)
    .replace(/%X/g, `${H}:${M}:${S}`)
    .replace(/%T/g, `${H}:${M}:${S}`);
});

// Forms
const wmForm = ref({
  path: "",
  opacity: 80,
  size: 20,
  position: "bottom-right",
  x_pct: 95,
  y_pct: 95,
});

const textForm = ref({
  text: "",
  fontsize: 36,
  color: "#ffffff",
  use_box: false,
  position: "bottom-center",
  x_pct: 50,
  y_pct: 90,
});

const tsForm = ref({
  format: "%Y-%m-%d %H:%M:%S",
  fontsize: 32,
  color: "#ffffff",
  use_box: true,
  position: "bottom-right",
  x_pct: 95,
  y_pct: 95,
});

const blurForm = ref({
  effect: "blur",
  x: 100,
  y: 100,
  w: 200,
  h: 200,
  intensity: 50,
});

const pipForm = ref({
  path: "",
  scale: 30,
  position: "top-right",
  x_pct: 85,
  y_pct: 15,
});

const stageRef = ref<HTMLElement | null>(null);
const stageMode = ref<string | null>(null);
const dragStart = ref<any>({});
const wmNaturalAspect = ref(1.0);
const isStagePlaying = ref(false);

const activeWatermarkSrc = computed(() => {
  if (wmForm.value.path) {
    return `/image?path=${encodeURIComponent(wmForm.value.path)}`;
  }
  return "";
});

const getVideoDims = () => {
  const vid = queueStore.selectedMediaInfo?.video;
  return {
    w: vid?.width || 1280,
    h: vid?.height || 720,
  };
};

const viewportStyle = computed(() => {
  const { w, h } = getVideoDims();
  const aspect = w / h;
  if (aspect > 2.2) {
    return {
      aspectRatio: `${w} / ${h}`,
      width: "100%",
      height: "auto",
      maxHeight: "100%",
    };
  }
  return {
    aspectRatio: `${w} / ${h}`,
    height: "100%",
    width: "auto",
    maxWidth: "100%",
  };
});

const wmBoxStyle = computed(() => {
  const { w: vW, h: vH } = getVideoDims();
  const widthPct = Math.max(5, Math.min(100, Number(wmForm.value.size) || 20));
  const aspect = wmNaturalAspect.value > 0 ? wmNaturalAspect.value : 1.0;
  const heightPct = ((vW * (widthPct / 100)) / aspect / vH) * 100;
  const xp = Math.max(0, Math.min(100, Number(wmForm.value.x_pct) || 0)) / 100;
  const yp = Math.max(0, Math.min(100, Number(wmForm.value.y_pct) || 0)) / 100;
  const leftPct = (100 - widthPct) * xp;
  const topPct = (100 - heightPct) * yp;
  return {
    left: `${leftPct}%`,
    top: `${topPct}%`,
    width: `${widthPct}%`,
    height: `${heightPct}%`,
    opacity: (Number(wmForm.value.opacity) || 80) / 100,
  };
});

const blurBoxStyle = computed(() => {
  const { w: vW, h: vH } = getVideoDims();
  const left = (blurForm.value.x / vW) * 100;
  const top = (blurForm.value.y / vH) * 100;
  const width = (blurForm.value.w / vW) * 100;
  const height = (blurForm.value.h / vH) * 100;
  const intensity = Number(blurForm.value.intensity) || 50;

  if (blurForm.value.effect === "pixelate") {
    const pixelSize = Math.max(4, Math.round(intensity / 4));
    return {
      left: Math.max(0, Math.min(100, left)) + "%",
      top: Math.max(0, Math.min(100, top)) + "%",
      width: Math.max(0, Math.min(100, width)) + "%",
      height: Math.max(0, Math.min(100, height)) + "%",
      backdropFilter: "blur(1px)",
      backgroundImage: `linear-gradient(to right, rgba(245, 158, 11, 0.45) 1px, transparent 1px), linear-gradient(to bottom, rgba(245, 158, 11, 0.45) 1px, transparent 1px), repeating-conic-gradient(rgba(0,0,0,0.45) 0% 25%, rgba(255,255,255,0.06) 0% 50%)`,
      backgroundSize: `${pixelSize}px ${pixelSize}px, ${pixelSize}px ${pixelSize}px, ${pixelSize * 2}px ${pixelSize * 2}px`,
      border: "2px dashed #f59e0b",
      boxShadow: "0 0 14px rgba(245, 158, 11, 0.45)",
    };
  } else {
    const blurRadius = Math.max(2, Math.round(intensity / 3.5));
    return {
      left: Math.max(0, Math.min(100, left)) + "%",
      top: Math.max(0, Math.min(100, top)) + "%",
      width: Math.max(0, Math.min(100, width)) + "%",
      height: Math.max(0, Math.min(100, height)) + "%",
      backdropFilter: `blur(${blurRadius}px)`,
      background: "rgba(56, 189, 248, 0.2)",
      border: "2px dashed #38bdf8",
      boxShadow: "0 0 14px rgba(56, 189, 248, 0.4)",
    };
  }
});

const onWatermarkImgLoad = (e: Event) => {
  const img = e.target as HTMLImageElement;
  if (img.naturalWidth && img.naturalHeight) {
    wmNaturalAspect.value = img.naturalWidth / img.naturalHeight;
  }
};

const setWmPreset = (pos: string) => {
  wmForm.value.position = pos;
  const map: Record<string, { x: number; y: number }> = {
    "top-left": { x: 5, y: 5 },
    "top-center": { x: 50, y: 5 },
    "top-right": { x: 95, y: 5 },
    "center-left": { x: 5, y: 50 },
    "center": { x: 50, y: 50 },
    "center-right": { x: 95, y: 50 },
    "bottom-left": { x: 5, y: 95 },
    "bottom-center": { x: 50, y: 95 },
    "bottom-right": { x: 95, y: 95 },
  };
  if (map[pos]) {
    wmForm.value.x_pct = map[pos].x;
    wmForm.value.y_pct = map[pos].y;
  }
};

const setTextPreset = (pos: string) => {
  textForm.value.position = pos;
  const map: Record<string, { x: number; y: number }> = {
    "top-left": { x: 15, y: 10 },
    "top-center": { x: 50, y: 10 },
    "top-right": { x: 85, y: 10 },
    "center-left": { x: 15, y: 50 },
    "center": { x: 50, y: 50 },
    "center-right": { x: 85, y: 50 },
    "bottom-left": { x: 15, y: 90 },
    "bottom-center": { x: 50, y: 90 },
    "bottom-right": { x: 85, y: 90 },
  };
  if (map[pos]) {
    textForm.value.x_pct = map[pos].x;
    textForm.value.y_pct = map[pos].y;
  }
};

const onStageMouseDown = (e: MouseEvent) => {
  if (!stageRef.value) return;
  const rect = stageRef.value.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const clickY = e.clientY - rect.top;

  if (subFx.value === "blur") {
    stageMode.value = "draw_blur";
    dragStart.value = { x: clickX, y: clickY };
    const { w: vW, h: vH } = getVideoDims();
    blurForm.value.x = Math.round((clickX / rect.width) * vW);
    blurForm.value.y = Math.round((clickY / rect.height) * vH);
    blurForm.value.w = 40;
    blurForm.value.h = 40;
  } else if (subFx.value === "watermark") {
    stageMode.value = "drag_wm";
    wmForm.value.x_pct = Math.round(Math.max(0, Math.min(100, (clickX / rect.width) * 100)));
    wmForm.value.y_pct = Math.round(Math.max(0, Math.min(100, (clickY / rect.height) * 100)));
    wmForm.value.position = "custom";
  } else if (subFx.value === "text") {
    stageMode.value = "drag_text";
    textForm.value.x_pct = Math.round(Math.max(5, Math.min(95, (clickX / rect.width) * 100)));
    textForm.value.y_pct = Math.round(Math.max(5, Math.min(95, (clickY / rect.height) * 100)));
    textForm.value.position = "custom";
  } else if (subFx.value === "timestamp") {
    stageMode.value = "drag_ts";
    tsForm.value.x_pct = Math.round(Math.max(5, Math.min(95, (clickX / rect.width) * 100)));
    tsForm.value.y_pct = Math.round(Math.max(5, Math.min(95, (clickY / rect.height) * 100)));
    tsForm.value.position = "custom";
  } else if (subFx.value === "pip") {
    stageMode.value = "drag_pip";
    pipForm.value.x_pct = Math.round(Math.max(10, Math.min(90, (clickX / rect.width) * 100)));
    pipForm.value.y_pct = Math.round(Math.max(10, Math.min(90, (clickY / rect.height) * 100)));
    pipForm.value.position = "custom";
  }
};

const onStartDragWatermark = () => { stageMode.value = "drag_wm"; };
const onStartDragText = () => { stageMode.value = "drag_text"; };
const onStartDragTimestamp = () => { stageMode.value = "drag_ts"; };
const onStartDragPip = () => { stageMode.value = "drag_pip"; };

const onStartMoveBlur = (e: MouseEvent) => {
  stageMode.value = "move_blur";
  dragStart.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    initX: blurForm.value.x,
    initY: blurForm.value.y,
  };
};

const onStartResizeBlur = (e: MouseEvent) => {
  stageMode.value = "resize_blur";
  dragStart.value = {
    mouseX: e.clientX,
    mouseY: e.clientY,
    initW: blurForm.value.w,
    initH: blurForm.value.h,
  };
};

const onGlobalMouseMove = (e: MouseEvent) => {
  if (!stageMode.value || !stageRef.value) return;
  const rect = stageRef.value.getBoundingClientRect();
  const { w: vW, h: vH } = getVideoDims();

  if (stageMode.value === "drag_wm") {
    const px = Math.round(Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)));
    const py = Math.round(Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)));
    wmForm.value.x_pct = px;
    wmForm.value.y_pct = py;
    wmForm.value.position = "custom";
  } else if (stageMode.value === "drag_text") {
    textForm.value.x_pct = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
    textForm.value.y_pct = Math.round(Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100)));
    textForm.value.position = "custom";
  } else if (stageMode.value === "drag_ts") {
    tsForm.value.x_pct = Math.round(Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100)));
    tsForm.value.y_pct = Math.round(Math.max(5, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100)));
    tsForm.value.position = "custom";
  } else if (stageMode.value === "drag_pip") {
    pipForm.value.x_pct = Math.round(Math.max(10, Math.min(90, ((e.clientX - rect.left) / rect.width) * 100)));
    pipForm.value.y_pct = Math.round(Math.max(10, Math.min(90, ((e.clientY - rect.top) / rect.height) * 100)));
    pipForm.value.position = "custom";
  } else if (stageMode.value === "draw_blur") {
    const curX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const curY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const boxX = Math.min(dragStart.value.x || 0, curX);
    const boxY = Math.min(dragStart.value.y || 0, curY);
    const boxW = Math.max(16, Math.abs(curX - (dragStart.value.x || 0)));
    const boxH = Math.max(16, Math.abs(curY - (dragStart.value.y || 0)));

    let rx = Math.round((boxX / rect.width) * vW);
    let ry = Math.round((boxY / rect.height) * vH);
    let rw = Math.round((boxW / rect.width) * vW);
    let rh = Math.round((boxH / rect.height) * vH);

    rw = Math.max(16, rw - (rw % 2));
    rh = Math.max(16, rh - (rh % 2));
    rx = Math.max(0, Math.min(vW - rw, rx));
    ry = Math.max(0, Math.min(vH - rh, ry));

    blurForm.value.x = rx;
    blurForm.value.y = ry;
    blurForm.value.w = rw;
    blurForm.value.h = rh;
  } else if (stageMode.value === "move_blur") {
    const dx = ((e.clientX - (dragStart.value.mouseX || 0)) / rect.width) * vW;
    const dy = ((e.clientY - (dragStart.value.mouseY || 0)) / rect.height) * vH;
    let nx = Math.round((dragStart.value.initX || 0) + dx);
    let ny = Math.round((dragStart.value.initY || 0) + dy);
    nx = Math.max(0, Math.min(vW - blurForm.value.w, nx));
    ny = Math.max(0, Math.min(vH - blurForm.value.h, ny));
    blurForm.value.x = nx;
    blurForm.value.y = ny;
  } else if (stageMode.value === "resize_blur") {
    const dw = ((e.clientX - (dragStart.value.mouseX || 0)) / rect.width) * vW;
    const dh = ((e.clientY - (dragStart.value.mouseY || 0)) / rect.height) * vH;
    let nw = Math.round((dragStart.value.initW || 0) + dw);
    let nh = Math.round((dragStart.value.initH || 0) + dh);
    nw = Math.max(16, Math.min(vW - blurForm.value.x, nw));
    nh = Math.max(16, Math.min(vH - blurForm.value.y, nh));
    nw = nw - (nw % 2);
    nh = nh - (nh % 2);
    blurForm.value.w = nw;
    blurForm.value.h = nh;
  }
};

const onGlobalMouseUp = () => {
  stageMode.value = null;
};

const toggleStagePlayback = () => {
  const v = document.getElementById("interactive-canvas-video") as HTMLVideoElement | null;
  if (!v) return;
  if (v.paused) {
    v.play();
    isStagePlaying.value = true;
  } else {
    v.pause();
    isStagePlaying.value = false;
  }
};

const onVideoError = () => {
  queueStore.hasVideoError = true;
};

const pickWatermark = async () => {
  const p = await apiClient.selectWatermarkFile();
  if (p) {
    wmForm.value.path = p;
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth && img.naturalHeight) {
        wmNaturalAspect.value = img.naturalWidth / img.naturalHeight;
      }
    };
    img.src = `/image?path=${encodeURIComponent(p)}`;
  }
};

const pickPip = async () => {
  const files = await apiClient.selectFiles();
  if (files && files.length > 0) {
    pipForm.value.path = files[0];
  }
};

const startListeners = () => {
  window.addEventListener("mousemove", onGlobalMouseMove);
  window.addEventListener("mouseup", onGlobalMouseUp);
  if (!clockTimer) {
    clockTimer = setInterval(() => {
      currentClock.value = new Date();
    }, 1000);
  }
};

const stopListeners = () => {
  window.removeEventListener("mousemove", onGlobalMouseMove);
  window.removeEventListener("mouseup", onGlobalMouseUp);
  if (clockTimer) {
    clearInterval(clockTimer);
    clockTimer = null;
  }
};

onMounted(() => {
  startListeners();
  const dims = getVideoDims();
  blurForm.value.x = Math.round(dims.w * 0.25);
  blurForm.value.y = Math.round(dims.h * 0.25);
  blurForm.value.w = Math.round(dims.w * 0.5) - (Math.round(dims.w * 0.5) % 2);
  blurForm.value.h = Math.round(dims.h * 0.5) - (Math.round(dims.h * 0.5) % 2);
});

onActivated(() => {
  startListeners();
});

onDeactivated(() => {
  stopListeners();
});

onUnmounted(() => {
  stopListeners();
});

const buildParams = (op: string) => {
  const p: any = {};
  if (configStore.config.output_dir) p.output_dir = configStore.config.output_dir;

  if (op === "add_watermark") {
    if (!wmForm.value.path) {
      message.error(t("msg_no_wm_file"));
      return null;
    }
    p.watermark_file = wmForm.value.path;
    p.opacity = wmForm.value.opacity;
    p.size = wmForm.value.size;
    p.position = wmForm.value.position;
    p.x_pct = wmForm.value.x_pct;
    p.y_pct = wmForm.value.y_pct;
  } else if (op === "add_text_overlay") {
    p.text = textForm.value.text;
    p.fontsize = textForm.value.fontsize;
    p.color = textForm.value.color;
    p.position = textForm.value.position;
    p.x_pct = textForm.value.x_pct;
    p.y_pct = textForm.value.y_pct;
    p.use_box = !!textForm.value.use_box;
  } else if (op === "add_timestamp") {
    p.format = tsForm.value.format;
    p.fontsize = tsForm.value.fontsize;
    p.color = tsForm.value.color;
    p.position = tsForm.value.position;
    p.x_pct = tsForm.value.x_pct;
    p.y_pct = tsForm.value.y_pct;
    p.use_box = !!tsForm.value.use_box;
  } else if (op === "blur_video") {
    p.effect = blurForm.value.effect;
    p.intensity = blurForm.value.intensity;
    p.x = blurForm.value.x;
    p.y = blurForm.value.y;
    p.w = blurForm.value.w;
    p.h = blurForm.value.h;
  } else if (op === "overlay") {
    if (!pipForm.value.path) {
      message.error(t("msg_no_pip_file"));
      return null;
    }
    p.pip_file = pipForm.value.path;
    p.scale = pipForm.value.scale;
    p.position = pipForm.value.position;
    p.x_pct = pipForm.value.x_pct;
    p.y_pct = pipForm.value.y_pct;
  }
  return p;
};

const runOp = async (op: string) => {
  if (!queueStore.activeFilePath) {
    message.warning(t("msg_select_first"));
    return;
  }
  const params = buildParams(op);
  if (!params) return;
  await apiClient.startOperation(op, queueStore.activeFilePath, params);
};

const runBatch = async (op: string) => {
  if (queueStore.fileQueue.length === 0) {
    message.warning(t("msg_queue_empty_batch"));
    return;
  }
  const params = buildParams(op);
  if (!params) return;
  const paths = queueStore.fileQueue.map((f) => f.path);
  await apiClient.startBatch(op, paths, params);
};
</script>

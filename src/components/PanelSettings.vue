<template>
  <div class="panel-settings-container">
    <h3 class="settings-title">{{ t`擴充設定` }}</h3>

    <!-- 設定項目 1: 側邊欄位置 -->
    <div class="setting-item">
      <label class="setting-label" for="position-select">{{ t`側邊欄位置` }}</label>
      <select
        id="position-select"
        v-model="tempSettings.panel_position"
        class="setting-select"
      >
        <option value="left">{{ t`左側` }}</option>
        <option value="right">{{ t`右側` }}</option>
      </select>
    </div>

    <!-- 設定項目 2: 語言選擇 -->
    <div class="setting-item">
      <label class="setting-label" for="language-select">{{ t`語言` }}</label>
      <select
        id="language-select"
        v-model="tempSettings.language"
        class="setting-select"
      >
        <option value="zh-TW">{{ t`繁體中文` }}</option>
        <option value="en">{{ t`English` }}</option>
      </select>
    </div>

    <!-- 設定項目 3: 進度條顏色 -->
    <div class="setting-item">
      <label class="setting-label">{{ t`進度條顏色` }}</label>

      <!-- 顏色選擇器 -->
      <div class="color-picker-group">
        <div class="color-picker-item">
          <label>{{ t`低值顏色` }}</label>
          <input
            type="color"
            v-model="tempSettings.progress_color_low"
            class="color-input"
          />
          <span class="color-value">{{ tempSettings.progress_color_low }}</span>
        </div>

        <div class="color-picker-item">
          <label>{{ t`高值顏色` }}</label>
          <input
            type="color"
            v-model="tempSettings.progress_color_high"
            class="color-input"
          />
          <span class="color-value">{{ tempSettings.progress_color_high }}</span>
        </div>
      </div>

      <!-- 進度條示例 -->
      <div class="progress-preview">
        <div class="preview-label">{{ t`預覽` }}</div>
        <div
          class="preview-bar-container"
          :style="{
            '--progress-low-color': tempSettings.progress_color_low,
            '--progress-high-color': tempSettings.progress_color_high
          }"
        >
          <div class="preview-bar-fill" :style="{ width: '75%' }"></div>
          <span class="preview-bar-text">75</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Settings } from '@/type/settings';
import { useI18nStore } from '@/store/i18n';

const props = defineProps<{
  initialSettings: Settings;
}>();

const { t } = useI18nStore();

// 臨時設定（避免直接修改 props）
const tempSettings = ref({
  panel_position: props.initialSettings.panel_position,
  language: props.initialSettings.language,
  progress_color_low: props.initialSettings.progress_color_low,
  progress_color_high: props.initialSettings.progress_color_high,
});

// 返回修改後的數據
function getData() {
  return klona(tempSettings.value);
}

// 暴露給外部呼叫
defineExpose({
  getData,
});
</script>

<style scoped>
.panel-settings-container {
  padding: 15px;
  min-width: 400px;
}

.settings-title {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--SmartThemeBodyColor);
  border-bottom: 1px solid var(--SmartThemeBorderColor);
  padding-bottom: 10px;
}

.setting-item {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  font-weight: 600;
  font-size: 15px;
  color: var(--SmartThemeBodyColor);
}

.setting-select {
  padding: 8px 12px;
  font-size: 14px;
  color: var(--SmartThemeBodyColor);
  background-color: var(--SmartThemeBlurTintColor);
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s;
}

.setting-select:hover {
  border-color: var(--SmartThemeQuoteColor);
}

.setting-select:focus {
  outline: none;
  border-color: var(--SmartThemeQuoteColor);
}

/* 顏色選擇器組 */
.color-picker-group {
  display: flex;
  gap: 20px;
  margin-bottom: 15px;
}

.color-picker-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.color-picker-item label {
  font-size: 13px;
  color: var(--SmartThemeBodyColor);
}

.color-input {
  width: 100%;
  height: 40px;
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--SmartThemeBlurTintColor);
}

.color-input:hover {
  border-color: var(--SmartThemeQuoteColor);
}

.color-value {
  font-size: 12px;
  color: var(--SmartThemeQuoteColor);
  font-family: monospace;
  text-align: center;
}

/* 進度條預覽 */
.progress-preview {
  padding: 15px;
  background: var(--SmartThemeBlurTintColor);
  border: 1px solid var(--SmartThemeBorderColor);
  border-radius: 4px;
}

.preview-label {
  font-size: 13px;
  color: var(--SmartThemeBodyColor);
  margin-bottom: 10px;
}

.preview-bar-container {
  position: relative;
  width: 100%;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 10px;
  overflow: hidden;
  display: flex;
  align-items: center;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1);
}

.preview-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background: linear-gradient(90deg, var(--progress-low-color, #d8b4a0), var(--progress-high-color, #a0b4d8));
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.preview-bar-text {
  position: relative;
  z-index: 1;
  width: 100%;
  text-align: center;
  color: var(--SmartThemeBodyColor);
  font-size: 12px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  letter-spacing: 0.5px;
}
</style>

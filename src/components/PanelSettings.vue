<template>
  <div class="panel-settings-container">
    <h3 class="settings-title">{{ t`擴充設定` }}</h3>

    <!-- 設定項目 1: 側邊欄位置 -->
    <div class="setting-item gal-settings">
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
    <div class="setting-item gal-settings">
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
    <div class="setting-item bar-settings">
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
import { useI18nStore } from '@/store/i18n';
import type { Settings } from '@/type/settings';

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

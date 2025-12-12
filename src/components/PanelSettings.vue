<template>
  <div class="panel-settings-container">
    <h3 class="settings-title">{{ t`擴充設定` }}</h3>

    <!-- 分頁切換 -->
    <div class="tabs-container">
      <div
        class="tab-button"
        :class="{ active: activeTab === 'general' }"
        @click="activeTab = 'general'"
      >
        {{ t`一般設定` }}
      </div>
      <div
        class="tab-button"
        :class="{ active: activeTab === 'prompt' }"
        @click="activeTab = 'prompt'"
      >
        {{ t`Prompt 設定` }}
      </div>
    </div>

    <!-- 一般設定分頁 -->
    <div v-show="activeTab === 'general'" class="tab-content">
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

    <!-- Prompt 設定分頁 -->
    <div v-show="activeTab === 'prompt'" class="tab-content">
      <div class="prompt-fields">
        <div class="prompt-field">
          <label>{{ t`時間` }} (time):</label>
          <textarea
            v-model="editablePrompt.time"
            class="text_pole prompt-textarea"
          />
        </div>

        <div class="prompt-field">
          <label>{{ t`地點` }} (place):</label>
          <textarea
            v-model="editablePrompt.place"
            class="text_pole prompt-textarea"
          />
        </div>

        <div class="prompt-field">
          <label>{{ t`天氣` }} (weather):</label>
          <textarea
            v-model="editablePrompt.weather"
            class="text_pole prompt-textarea"
          />
        </div>

        <div class="prompt-field">
          <label>{{ t`新聞標題` }} (news.title):</label>
          <textarea
            v-model="editablePrompt.newsTitle"
            class="text_pole prompt-textarea"
          />
        </div>

        <div class="prompt-field">
          <label>{{ t`新聞內文` }} (news.content):</label>
          <textarea
            v-model="editablePrompt.newsContent"
            class="text_pole prompt-textarea"
          />
        </div>
      </div>

      <div class="prompt-actions">
        <div class="menu_button" @click="restorePrompt">
          <i class="fa-solid fa-rotate-left"></i> {{ t`恢復預設` }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18nStore } from '@/store/i18n';
import type { Settings, CustomPrompt } from '@/type/settings';
import { DEFAULT_PROMPT_EN, DEFAULT_PROMPT_ZH_TW } from '@/promptGenerator';

const props = defineProps<{
  initialSettings: Settings;
}>();

const { t } = useI18nStore();

// 分頁狀態
const activeTab = ref<'general' | 'prompt'>('general');

// 臨時設定（避免直接修改 props）
const tempSettings = ref({
  panel_position: props.initialSettings.panel_position,
  language: props.initialSettings.language,
  progress_color_low: props.initialSettings.progress_color_low,
  progress_color_high: props.initialSettings.progress_color_high,
});

// 根據當前語言取得預設 prompt
const defaultPrompt = computed(() => {
  return tempSettings.value.language === 'en'
    ? DEFAULT_PROMPT_EN
    : DEFAULT_PROMPT_ZH_TW;
});

// 可編輯的 prompt（直接顯示和編輯，包含預設值）
const editablePrompt = ref({
  time: '',
  place: '',
  weather: '',
  newsTitle: '',
  newsContent: '',
});

// 初始化 editablePrompt（合併自訂和預設值）
watch(
  [() => props.initialSettings.custom_prompt, () => tempSettings.value.language],
  ([newPrompt, language]) => {
    console.log('[PanelSettings] custom_prompt changed:', newPrompt);
    console.log('[PanelSettings] language:', language);

    const defaults = language === 'en' ? DEFAULT_PROMPT_EN : DEFAULT_PROMPT_ZH_TW;

    editablePrompt.value = {
      time: newPrompt?.time || defaults.time,
      place: newPrompt?.place || defaults.place,
      weather: newPrompt?.weather || defaults.weather,
      newsTitle: newPrompt?.newsTitle || defaults.newsTitle,
      newsContent: newPrompt?.newsContent || defaults.newsContent,
    };

    console.log('[PanelSettings] editablePrompt.value updated to:', editablePrompt.value);
  },
  { immediate: true }
);

// 同步其他設定
watch(
  () => props.initialSettings,
  (newSettings) => {
    tempSettings.value = {
      panel_position: newSettings.panel_position,
      language: newSettings.language,
      progress_color_low: newSettings.progress_color_low,
      progress_color_high: newSettings.progress_color_high,
    };
  },
  { immediate: true, deep: true }
);

// 恢復預設 Prompt
function restorePrompt() {
  const defaults = tempSettings.value.language === 'en' ? DEFAULT_PROMPT_EN : DEFAULT_PROMPT_ZH_TW;
  editablePrompt.value = {
    time: defaults.time,
    place: defaults.place,
    weather: defaults.weather,
    newsTitle: defaults.newsTitle,
    newsContent: defaults.newsContent,
  };
}

// 返回修改後的數據
function getData() {
  console.log('[PanelSettings] getData called');
  console.log('[PanelSettings] editablePrompt.value:', editablePrompt.value);

  const defaults = tempSettings.value.language === 'en' ? DEFAULT_PROMPT_EN : DEFAULT_PROMPT_ZH_TW;

  // 只保存與預設值不同的欄位
  const promptToSave: CustomPrompt = {};
  if (editablePrompt.value.time?.trim() && editablePrompt.value.time !== defaults.time) {
    promptToSave.time = editablePrompt.value.time.trim();
  }
  if (editablePrompt.value.place?.trim() && editablePrompt.value.place !== defaults.place) {
    promptToSave.place = editablePrompt.value.place.trim();
  }
  if (editablePrompt.value.weather?.trim() && editablePrompt.value.weather !== defaults.weather) {
    promptToSave.weather = editablePrompt.value.weather.trim();
  }
  if (editablePrompt.value.newsTitle?.trim() && editablePrompt.value.newsTitle !== defaults.newsTitle) {
    promptToSave.newsTitle = editablePrompt.value.newsTitle.trim();
  }
  if (editablePrompt.value.newsContent?.trim() && editablePrompt.value.newsContent !== defaults.newsContent) {
    promptToSave.newsContent = editablePrompt.value.newsContent.trim();
  }

  console.log('[PanelSettings] promptToSave:', promptToSave);

  const result = {
    ...klona(tempSettings.value),
    custom_prompt: Object.keys(promptToSave).length > 0 ? promptToSave : undefined,
  };

  console.log('[PanelSettings] getData result:', result);

  return result;
}

// 暴露給外部呼叫
defineExpose({
  getData,
});
</script>
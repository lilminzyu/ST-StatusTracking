<template>
  <div class="fixed-fields-settings-container">
    <div class="field-list">
      <!-- 時間欄位 -->
      <div class="fixed-field-item" :class="{ disabled: !tempFixedFieldsEnabled.time }">
        <div class="field-row">
          <div class="field-left">
            <input
              id="fixed-field-time"
              v-model="tempFixedFieldsEnabled.time"
              type="checkbox"
              class="field-checkbox"
            />
            <label for="fixed-field-time" class="field-name">{{ t`時間` }}</label>
          </div>
          <textarea
            v-model="editablePrompt.time"
            class="text_pole field-textarea"
            :placeholder="defaultPrompt.time"
            :disabled="!tempFixedFieldsEnabled.time"
          />
        </div>
      </div>

      <!-- 地點欄位 -->
      <div class="fixed-field-item" :class="{ disabled: !tempFixedFieldsEnabled.place }">
        <div class="field-row">
          <div class="field-left">
            <input
              id="fixed-field-place"
              v-model="tempFixedFieldsEnabled.place"
              type="checkbox"
              class="field-checkbox"
            />
            <label for="fixed-field-place" class="field-name">{{ t`地點` }}</label>
          </div>
          <textarea
            v-model="editablePrompt.place"
            class="text_pole field-textarea"
            :placeholder="defaultPrompt.place"
            :disabled="!tempFixedFieldsEnabled.place"
          />
        </div>
      </div>

      <!-- 天氣欄位 -->
      <div class="fixed-field-item" :class="{ disabled: !tempFixedFieldsEnabled.weather }">
        <div class="field-row">
          <div class="field-left">
            <input
              id="fixed-field-weather"
              v-model="tempFixedFieldsEnabled.weather"
              type="checkbox"
              class="field-checkbox"
            />
            <label for="fixed-field-weather" class="field-name">{{ t`天氣` }}</label>
          </div>
          <textarea
            v-model="editablePrompt.weather"
            class="text_pole field-textarea"
            :placeholder="defaultPrompt.weather"
            :disabled="!tempFixedFieldsEnabled.weather"
          />
        </div>
      </div>

      <!-- 新鮮事區塊 -->
      <div class="fixed-field-item" :class="{ disabled: !tempFixedFieldsEnabled.news }">
        <!-- 新鮮事主控制 -->
        <div class="news-header">
          <input
            id="fixed-field-news"
            v-model="tempFixedFieldsEnabled.news"
            type="checkbox"
            class="field-checkbox"
          />
          <label for="fixed-field-news" class="field-name">{{ t`新鮮事` }}</label>
        </div>

        <!-- 新鮮事類型 -->
        <div class="news-child-row">
          <div class="news-child-label">
            <label class="field-name">{{ t`新鮮事類型` }} (type)</label>
          </div>
          <textarea
            v-model="editablePrompt.newsType"
            class="text_pole field-textarea"
            :placeholder="defaultPrompt.newsType"
            :disabled="!tempFixedFieldsEnabled.news"
          />
        </div>

        <!-- 新鮮事標題 -->
        <div class="news-child-row">
          <div class="news-child-label">
            <label class="field-name">{{ t`新鮮事標題` }} (title)</label>
          </div>
          <textarea
            v-model="editablePrompt.newsTitle"
            class="text_pole field-textarea"
            :placeholder="defaultPrompt.newsTitle"
            :disabled="!tempFixedFieldsEnabled.news"
          />
        </div>

        <!-- 新鮮事內文 -->
        <div class="news-child-row">
          <div class="news-child-label">
            <label class="field-name">{{ t`新鮮事內文` }} (content)</label>
          </div>
          <textarea
            v-model="editablePrompt.newsContent"
            class="text_pole field-textarea"
            :placeholder="defaultPrompt.newsContent"
            :disabled="!tempFixedFieldsEnabled.news"
          />
        </div>
      </div>
    </div>

    <div class="prompt-actions">
      <div class="menu_button" @click="restorePrompt">
        <i class="fa-solid fa-rotate-left"></i> {{ t`恢復預設` }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_PROMPT_EN, DEFAULT_PROMPT_ZH_TW } from '@/promptGenerator';
import { useI18nStore } from '@/store/i18n';
import type { CustomPrompt, FixedFieldsEnabled, Settings } from '@/type/settings';

const props = defineProps<{
  initialSettings: Settings;
}>();

const { t } = useI18nStore();

// 固定欄位開關
const tempFixedFieldsEnabled = ref<FixedFieldsEnabled>({
  time: props.initialSettings.fixed_fields_enabled.time,
  place: props.initialSettings.fixed_fields_enabled.place,
  weather: props.initialSettings.fixed_fields_enabled.weather,
  news: props.initialSettings.fixed_fields_enabled.news,
});

// 根據當前語言取得預設 prompt
const defaultPrompt = computed(() => {
  return props.initialSettings.language === 'en'
    ? DEFAULT_PROMPT_EN
    : DEFAULT_PROMPT_ZH_TW;
});

// 可編輯的 prompt（直接顯示和編輯，包含預設值）
const editablePrompt = ref({
  time: '',
  place: '',
  weather: '',
  newsType: '',
  newsTitle: '',
  newsContent: '',
});

// 初始化 editablePrompt（合併自訂和預設值）
watch(
  [() => props.initialSettings.custom_prompt, () => props.initialSettings.language],
  ([newPrompt, language]) => {
    const defaults = language === 'en' ? DEFAULT_PROMPT_EN : DEFAULT_PROMPT_ZH_TW;

    editablePrompt.value = {
      time: newPrompt?.time || defaults.time,
      place: newPrompt?.place || defaults.place,
      weather: newPrompt?.weather || defaults.weather,
      newsType: newPrompt?.newsType || defaults.newsType,
      newsTitle: newPrompt?.newsTitle || defaults.newsTitle,
      newsContent: newPrompt?.newsContent || defaults.newsContent,
    };
  },
  { immediate: true }
);

// 同步固定欄位開關
watch(
  () => props.initialSettings.fixed_fields_enabled,
  (newEnabled) => {
    tempFixedFieldsEnabled.value = klona(newEnabled);
  },
  { immediate: true, deep: true }
);

// 恢復預設 Prompt
function restorePrompt() {
  const defaults = props.initialSettings.language === 'en' ? DEFAULT_PROMPT_EN : DEFAULT_PROMPT_ZH_TW;
  editablePrompt.value = {
    time: defaults.time,
    place: defaults.place,
    weather: defaults.weather,
    newsType: defaults.newsType,
    newsTitle: defaults.newsTitle,
    newsContent: defaults.newsContent,
  };
}

// 返回修改後的數據
function getData() {
  const defaults = props.initialSettings.language === 'en' ? DEFAULT_PROMPT_EN : DEFAULT_PROMPT_ZH_TW;

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
  if (editablePrompt.value.newsType?.trim() && editablePrompt.value.newsType !== defaults.newsType) {
    promptToSave.newsType = editablePrompt.value.newsType.trim();
  }
  if (editablePrompt.value.newsTitle?.trim() && editablePrompt.value.newsTitle !== defaults.newsTitle) {
    promptToSave.newsTitle = editablePrompt.value.newsTitle.trim();
  }
  if (editablePrompt.value.newsContent?.trim() && editablePrompt.value.newsContent !== defaults.newsContent) {
    promptToSave.newsContent = editablePrompt.value.newsContent.trim();
  }

  return {
    fixed_fields_enabled: klona(tempFixedFieldsEnabled.value),
    custom_prompt: Object.keys(promptToSave).length > 0 ? promptToSave : undefined,
  };
}

// 暴露給外部呼叫
defineExpose({
  getData,
});
</script>
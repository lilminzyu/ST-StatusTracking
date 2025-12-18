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
          <div class="field-left news-child-label">
            <label class="field-name">{{ t`新鮮事類型` }}</label>
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
          <div class="field-left news-child-label">
            <label class="field-name">{{ t`新鮮事標題` }}</label>
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
          <div class="field-left news-child-label">
            <label class="field-name">{{ t`新鮮事內文` }}</label>
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

    <!-- 備忘錄欄位 -->
    <div class="fixed-field-item" :class="{ disabled: !tempFixedFieldsEnabled.notes }">
      <div class="field-row">
        <div class="field-left">
          <input
            id="fixed-field-notes"
            v-model="tempFixedFieldsEnabled.notes"
            type="checkbox"
            class="field-checkbox"
          />
          <label for="fixed-field-notes" class="field-name">{{ t`備忘錄` }}</label>
        </div>
        <textarea
          v-model="editablePrompt.notes"
          class="text_pole field-textarea"
          :placeholder="defaultPrompt.notes"
          :disabled="!tempFixedFieldsEnabled.notes"
        />
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
import { Popup, POPUP_RESULT, POPUP_TYPE } from '@sillytavern/scripts/popup';

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
  notes: props.initialSettings.fixed_fields_enabled.notes,
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
  notes: '',
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
      notes: newPrompt?.notes || defaults.notes,
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
async function restorePrompt() {
  // 彈出確認對話框
  const popup = new Popup('確定要恢復預設 Prompt 嗎？', POPUP_TYPE.CONFIRM);
  const result = await popup.show();

  if (result !== POPUP_RESULT.AFFIRMATIVE) return;

  const defaults = props.initialSettings.language === 'en' ? DEFAULT_PROMPT_EN : DEFAULT_PROMPT_ZH_TW;
  editablePrompt.value = {
    time: defaults.time,
    place: defaults.place,
    weather: defaults.weather,
    newsType: defaults.newsType,
    newsTitle: defaults.newsTitle,
    newsContent: defaults.newsContent,
    notes: defaults.notes,
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
  if (editablePrompt.value.notes?.trim() && editablePrompt.value.notes !== defaults.notes) {
    promptToSave.notes = editablePrompt.value.notes.trim();
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
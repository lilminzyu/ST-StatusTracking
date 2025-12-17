<template>
  <div class="prompt-editor-container">
    <h3 class="settings-title">{{ t`編輯固定欄位 Prompt` }}</h3>

    <div class="prompt-fields">
      <div class="prompt-field">
        <label>{{ t`時間` }} (time):</label>
        <textarea
          v-model="localPrompt.time"
          class="text_pole prompt-textarea"
          :placeholder="defaultPrompt.time"
        />
      </div>

      <div class="prompt-field">
        <label>{{ t`地點` }} (place):</label>
        <textarea
          v-model="localPrompt.place"
          class="text_pole prompt-textarea"
          :placeholder="defaultPrompt.place"
        />
      </div>

      <div class="prompt-field">
        <label>{{ t`天氣` }} (weather):</label>
        <textarea
          v-model="localPrompt.weather"
          class="text_pole prompt-textarea"
          :placeholder="defaultPrompt.weather"
        />
      </div>

      <div class="prompt-field">
        <label>{{ t`新鮮事標題` }} (news.title):</label>
        <textarea
          v-model="localPrompt.newsTitle"
          class="text_pole prompt-textarea"
          :placeholder="defaultPrompt.newsTitle"
        />
      </div>

      <div class="prompt-field">
        <label>{{ t`新鮮事內文` }} (news.content):</label>
        <textarea
          v-model="localPrompt.newsContent"
          class="text_pole prompt-textarea"
          :placeholder="defaultPrompt.newsContent"
        />
      </div>
    </div>

    <div class="prompt-actions">
      <div class="menu_button" @click="restore">
        <i class="fa-solid fa-rotate-left"></i> {{ t`恢復預設` }}
      </div>
      <div class="menu_button" @click="save">
        <i class="fa-solid fa-save"></i> {{ t`儲存` }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DEFAULT_PROMPT_EN, DEFAULT_PROMPT_ZH_TW } from '@/promptGenerator';
import { useI18nStore } from '@/store/i18n';
import { useSettingsStore } from '@/store/settings';
import type { CustomPrompt } from '@/type/settings';

const { t } = useI18nStore();
const settingsStore = useSettingsStore();

// 本地暫存的 prompt
const localPrompt = ref<CustomPrompt>({
  time: '',
  place: '',
  weather: '',
  newsTitle: '',
  newsContent: '',
});

// 根據當前語言取得預設 prompt
const defaultPrompt = computed(() => {
  return settingsStore.settings.language === 'en'
    ? DEFAULT_PROMPT_EN
    : DEFAULT_PROMPT_ZH_TW;
});

// 初始化
onMounted(() => {
  const savedPrompt = settingsStore.settings.custom_prompt;
  if (savedPrompt) {
    localPrompt.value = { ...savedPrompt };
  }
});

// 恢復預設
function restore() {
  localPrompt.value = {
    time: '',
    place: '',
    weather: '',
    newsTitle: '',
    newsContent: '',
  };
}

// 儲存
function save() {
  // 只保存有值的欄位
  const promptToSave: CustomPrompt = {};
  if (localPrompt.value.time?.trim()) promptToSave.time = localPrompt.value.time.trim();
  if (localPrompt.value.place?.trim()) promptToSave.place = localPrompt.value.place.trim();
  if (localPrompt.value.weather?.trim()) promptToSave.weather = localPrompt.value.weather.trim();
  if (localPrompt.value.newsTitle?.trim()) promptToSave.newsTitle = localPrompt.value.newsTitle.trim();
  if (localPrompt.value.newsContent?.trim()) promptToSave.newsContent = localPrompt.value.newsContent.trim();

  settingsStore.settings.custom_prompt = Object.keys(promptToSave).length > 0 ? promptToSave : undefined;

  // 關閉彈窗（由父組件處理）
  emit('close');
}

const emit = defineEmits<{
  close: [];
}>();
</script>

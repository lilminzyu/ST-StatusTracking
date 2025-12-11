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
</style>

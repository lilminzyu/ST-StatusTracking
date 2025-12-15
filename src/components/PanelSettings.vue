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
        <option value="zh-CN">{{ t`簡體中文` }}</option>
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

    <!-- 設定項目 4: 備份與還原 -->
    <div class="setting-item backup-settings">
      <div class="backup-header">
        <label class="setting-label">{{ t`備份與還原` }}</label>
        <div class="backup-actions">
          <div class="menu_button" @click="handleImport">
            <i class="fa-solid fa-file-import"></i> {{ t`匯入所有設定` }}
          </div>
          <div class="menu_button" @click="handleExport">
            <i class="fa-solid fa-file-export"></i> {{ t`匯出所有設定` }}
          </div>
        </div>
      </div>
      <div class="backup-description">
        {{ t`匯出所有設定（包含固定欄位、自訂欄位、Prompt、樣式等）` }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18nStore } from '@/store/i18n';
import { useSettingsStore } from '@/store/settings';
import type { Settings } from '@/type/settings';
import {
  downloadJSON,
  exportSettings,
  openFileSelector,
  readJSONFile,
  validateImportData,
} from '@/utils/importExport';
import { logger } from '@/utils/logger';

const props = defineProps<{
  initialSettings: Settings;
}>();

const emit = defineEmits<{
  settingsImported: [settings: Partial<Settings>];
}>();

const { t } = useI18nStore();
const settingsStore = useSettingsStore();

// 臨時設定（避免直接修改 props）
const tempSettings = ref({
  panel_position: props.initialSettings.panel_position,
  language: props.initialSettings.language,
  progress_color_low: props.initialSettings.progress_color_low,
  progress_color_high: props.initialSettings.progress_color_high,
});

// 匯出備份
async function handleExport() {
  try {
    logger.log('[PanelSettings] 開始匯出備份');

    // 從 manifest 獲取版本號
    const version = '0.3.2'; // TODO: 從 manifest.json 動態讀取

    // 匯出完整設定
    const exportData = exportSettings(settingsStore.settings, version);

    // 下載 JSON
    const filename = `status-tracking-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadJSON(exportData, filename);

    // 顯示成功提示
    toastr.success(t`備份已匯出`, t`成功`);
  } catch (error) {
    logger.error('[PanelSettings] 匯出失敗:', error);
    toastr.error(t`匯出失敗，請檢查控制台`, t`錯誤`);
  }
}

// 匯入備份
async function handleImport() {
  try {
    logger.log('[PanelSettings] 開始匯入備份');

    // 打開檔案選擇器
    const file = await openFileSelector('.json');
    if (!file) {
      logger.log('[PanelSettings] 用戶取消選擇檔案');
      return;
    }

    // 讀取 JSON
    const importData = await readJSONFile(file);

    // 驗證資料
    const validation = validateImportData(importData);
    if (!validation.valid) {
      toastr.error(validation.error || t`資料格式錯誤`, t`匯入失敗`);
      return;
    }

    // 確認匯入
    const confirmed = confirm(
      t`確定要匯入此備份嗎？\n這將覆蓋目前的所有設定（欄位、Prompt、樣式等）。`
    );
    if (!confirmed) {
      logger.log('[PanelSettings] 用戶取消匯入');
      return;
    }

    // 應用設定
    if (validation.data) {
      Object.assign(settingsStore.settings, validation.data);

      // 同步更新臨時設定
      if (validation.data.panel_position) {
        tempSettings.value.panel_position = validation.data.panel_position;
      }
      if (validation.data.language) {
        tempSettings.value.language = validation.data.language;
      }
      if (validation.data.progress_color_low) {
        tempSettings.value.progress_color_low = validation.data.progress_color_low;
      }
      if (validation.data.progress_color_high) {
        tempSettings.value.progress_color_high = validation.data.progress_color_high;
      }

      logger.log('[PanelSettings] 匯入成功');

      // 顯示成功提示，並自動關閉設定面板
      toastr.success(t`備份已還原`, t`成功`);

      // 觸發取消按鈕來關閉面板
        const cancelButton = document.querySelector('.popup-button-cancel') as HTMLElement;
        if (cancelButton) {
          cancelButton.click();
        }
    }
  } catch (error) {
    logger.error('[PanelSettings] 匯入失敗:', error);
    toastr.error(
      error instanceof Error ? error.message : t`匯入失敗`,
      t`錯誤`
    );
  }
}

// 返回修改後的數據
function getData() {
  return klona(tempSettings.value);
}

// 暴露給外部呼叫
defineExpose({
  getData,
});
</script>


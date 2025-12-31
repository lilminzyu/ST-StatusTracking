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
      <div class="progress-color-header" @click="toggleProgressColor">
        <label class="setting-label">{{ t`進度條顏色` }}</label>
        <i class="fa-solid fa-chevron-down progress-color-toggle-icon" :class="{ collapsed: !progressColorExpanded }"></i>
      </div>

      <div v-show="progressColorExpanded" class="progress-color-content">
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

    <!-- 設定項目 4: 自訂 CSS -->
    <div class="setting-item css-editor-settings">
      <div class="css-editor-header" @click="toggleCSSEditor">
        <label class="setting-label">{{ t`自訂 CSS` }}</label>
        <i class="fa-solid fa-chevron-down css-toggle-icon" :class="{ collapsed: !cssEditorExpanded }"></i>
      </div>

      <div v-show="cssEditorExpanded" class="css-editor-content">
        <div class="css-editor-actions">
          <div class="menu_button menu_button_icon" @click="handleLoadTemplate" :title="t`載入範例模板`">
            <i class="fa-solid fa-lightbulb"></i>
          </div>
          <div class="menu_button menu_button_icon" @click="handleImportCSS" :title="t`匯入 CSS`">
            <i class="fa-solid fa-file-import"></i>
          </div>
          <div class="menu_button menu_button_icon" @click="handleExportCSS" :title="t`匯出 CSS`">
            <i class="fa-solid fa-file-export"></i>
          </div>
        </div>

        <textarea
          v-model="tempSettings.custom_css"
          class="css-textarea"
          :placeholder="t`在此輸入自訂 CSS...`"
          spellcheck="false"
        ></textarea>

        <div class="css-editor-tips">
          {{ t`提示：編輯完成後點擊彈窗下方的「確定」按鈕即可套用樣式` }}
        </div>
      </div>
    </div>

    <!-- 設定項目 5: 配置管理 - 切換配置 -->
    <div class="setting-item gal-settings">
      <label class="setting-label" for="preset-select">{{ t`切換配置` }}</label>
      <div class="preset-select-wrapper">
        <select id="preset-select" v-model="selectedPresetId" @change="handlePresetChange" class="setting-select">
          <option value="">{{ t`選擇配置...` }}</option>
          <optgroup v-if="cardPresets.length > 0" :label="t`角色卡配置`">
            <option v-for="preset in cardPresets" :key="preset.id" :value="preset.id">
              {{ preset.name }}
            </option>
          </optgroup>
          <optgroup v-if="manualPresets.length > 0" :label="t`已儲存配置`">
            <option v-for="preset in manualPresets" :key="preset.id" :value="preset.id">
              {{ preset.name }}
            </option>
          </optgroup>
        </select>
        <div class="preset-actions">
          <div class="menu_button menu_button_icon" @click="handleDeletePreset" :title="t`刪除配置`" :class="{ disabled: !canDeletePreset }">
            <i class="fa-solid fa-trash"></i>
          </div>
        </div>
      </div>
    </div>

    <!-- 重置為角色卡配置 -->
    <div v-if="hasChatSettingsValue" class="setting-item gal-settings">
      <label class="setting-label">{{ t`聊天窗設定` }}</label>
      <div class="preset-select-wrapper">
        <span class="bound-preset-name">{{ t`此聊天窗有自訂設定` }}</span>
        <div class="menu_button menu_button_icon" @click="handleResetToCardPreset" :title="t`重置為角色卡配置`">
          <i class="fa-solid fa-rotate-left"></i>
        </div>
      </div>
    </div>

    <!-- 設定項目 6: 配置管理 - 儲存配置 -->
    <div class="setting-item gal-settings">
      <label class="setting-label" for="preset-name-input">{{ t`儲存為新配置` }}</label>
      <div class="preset-select-wrapper">
        <input
          id="preset-name-input"
          v-model="newPresetName"
          type="text"
          class="setting-select text_pole"
          :placeholder="t`輸入配置名稱...`"
        />
        <div class="menu_button menu_button_icon" @click="handleSavePreset" :title="t`儲存為新配置`" :class="{ disabled: !newPresetName.trim() }">
          <i class="fa-solid fa-save"></i>
        </div>
      </div>
    </div>

    <!-- 設定項目 6: 備份還原與儲存 -->
    <div class="setting-item backup-settings">
      <div class="backup-header">
        <label class="setting-label">{{ t`備份還原與儲存` }}</label>
        <div class="backup-actions">
          <div class="menu_button" @click="handleImport">
            <i class="fa-solid fa-file-import"></i> {{ t`匯入所有設定` }}
          </div>
          <div class="menu_button" @click="handleExport">
            <i class="fa-solid fa-file-export"></i> {{ t`匯出所有設定` }}
          </div>
          <div class="menu_button" @click="handleSaveToCharacter">
            <i class="fa-solid fa-id-card"></i> {{ t`儲存到角色卡` }}
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
import { clearChatSettings, hasChatSettings } from '@/index';
import { useI18nStore } from '@/store/i18n';
import { useSettingsStore } from '@/store/settings';
import type { Preset, Settings } from '@/type/settings';
import { applyCustomCSS } from '@/utils/cssInjector';
import {
  createPreset,
  downloadJSON,
  exportSettings,
  openFileSelector,
  presetDataToSettings,
  readJSONFile,
  saveSettingsToCharacterCard,
  validateImportData
} from '@/utils/importExport';
import { logger } from '@/utils/logger';
import { Popup, POPUP_RESULT, POPUP_TYPE } from '@sillytavern/scripts/popup';
import { getContext } from '@sillytavern/scripts/st-context';

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
  custom_css: props.initialSettings.custom_css,
});

// 進度條顏色展開/收合狀態
const progressColorExpanded = ref(false);

// 切換進度條顏色
function toggleProgressColor() {
  progressColorExpanded.value = !progressColorExpanded.value;
}

// CSS 編輯器展開/收合狀態
const cssEditorExpanded = ref(false);

// ============ 配置管理相關 ============
const selectedPresetId = ref('');
const newPresetName = ref('');

// 從角色卡匯入的配置（ID 以 __fromCard_ 開頭，排除 __declined_）
const cardPresets = computed(() => {
  return settingsStore.settings.presets.filter(
    p => p.id.startsWith('__fromCard_') && !p.id.startsWith('__declined_')
  );
});

// 手動儲存的配置（不是從角色卡來的，也不是拒絕標記）
const manualPresets = computed(() => {
  return settingsStore.settings.presets.filter(
    p => !p.id.startsWith('__fromCard_') && !p.id.startsWith('__declined_')
  );
});

// 是否可以刪除選中的配置（所有配置都可刪除）
const canDeletePreset = computed(() => {
  if (!selectedPresetId.value) return false;
  // 排除拒絕標記，其他都可刪
  return !selectedPresetId.value.startsWith('__declined_');
});

// 當前聊天窗是否有暫存設定
const hasChatSettingsValue = computed(() => hasChatSettings());

// 取得選中的配置
function getSelectedPreset(): Preset | null {
  if (!selectedPresetId.value) return null;
  // 從儲存的配置中尋找
  return settingsStore.settings.presets.find(p => p.id === selectedPresetId.value) || null;
}

// 下拉選單選擇變更時觸發
async function handlePresetChange() {
  const preset = getSelectedPreset();
  if (!preset) return;

  const popup = new Popup(
    t`確定要切換到配置` + `「${preset.name}」` + t`嗎？` + '<br>' + t`這將覆蓋目前的欄位、Prompt、樣式等設定。`,
    POPUP_TYPE.CONFIRM
  );
  const result = await popup.show();

  if (result !== POPUP_RESULT.AFFIRMATIVE) {
    // 用戶取消，重置選擇
    selectedPresetId.value = '';
    return;
  }

  // 套用配置到 store
  const settingsData = presetDataToSettings(preset.data);
  Object.assign(settingsStore.settings, settingsData);

  // 更新臨時設定（確保 UI 同步）
  if (settingsData.progress_color_low) {
    tempSettings.value.progress_color_low = settingsData.progress_color_low;
  }
  if (settingsData.progress_color_high) {
    tempSettings.value.progress_color_high = settingsData.progress_color_high;
  }
  if (settingsData.custom_css !== undefined) {
    tempSettings.value.custom_css = settingsData.custom_css;
    applyCustomCSS(settingsData.custom_css);
  }

  toastr.success(t`已切換到配置` + `「${preset.name}」`, t`成功`);
  logger.log('[PanelSettings] 已切換配置:', preset.name);

  // 重置選擇
  selectedPresetId.value = '';

  // 關閉設定面板，讓變更生效
  const cancelButton = document.querySelector('.popup-button-cancel') as HTMLElement;
  if (cancelButton) {
    cancelButton.click();
  }
}

// 重置為角色卡配置
async function handleResetToCardPreset() {
  const context = getContext();
  const characterId = context.characterId;
  if (characterId === undefined || characterId === null) return;

  const character = (context.characters as any)?.[characterId];
  const characterName = character?.name || '角色';

  // 找到角色卡配置
  const cardPreset = settingsStore.settings.presets.find(
    p => p.id.startsWith('__fromCard_') && p.name === characterName
  );

  if (!cardPreset) {
    toastr.warning(t`找不到角色卡配置`, t`提示`);
    return;
  }

  const popup = new Popup(
    t`確定要重置為角色卡配置` + `「${cardPreset.name}」` + t`嗎？` + '<br>' + t`這將清除此聊天窗的自訂設定。`,
    POPUP_TYPE.CONFIRM
  );
  const result = await popup.show();
  if (result !== POPUP_RESULT.AFFIRMATIVE) return;

  // 清除聊天窗暫存設定
  clearChatSettings();

  // 套用角色卡配置
  const settingsData = presetDataToSettings(cardPreset.data);
  Object.assign(settingsStore.settings, settingsData);

  if (settingsData.progress_color_low) {
    tempSettings.value.progress_color_low = settingsData.progress_color_low;
  }
  if (settingsData.progress_color_high) {
    tempSettings.value.progress_color_high = settingsData.progress_color_high;
  }
  if (settingsData.custom_css !== undefined) {
    tempSettings.value.custom_css = settingsData.custom_css;
    applyCustomCSS(settingsData.custom_css);
  }

  toastr.success(t`已重置為角色卡配置`, t`成功`);
  logger.log('[PanelSettings] 已重置為角色卡配置');

  // 關閉設定面板
  const cancelButton = document.querySelector('.popup-button-cancel') as HTMLElement;
  if (cancelButton) {
    cancelButton.click();
  }
}

// 儲存為新配置
function handleSavePreset() {
  const name = newPresetName.value.trim();
  if (!name) return;

  const preset = createPreset(name, settingsStore.settings);
  settingsStore.settings.presets.push(preset);

  toastr.success(t`已儲存配置` + `「${name}」`, t`成功`);
  logger.log('[PanelSettings] 已儲存配置:', name);

  // 清空輸入框並選中新配置
  newPresetName.value = '';
  selectedPresetId.value = preset.id;
}

// 刪除配置
async function handleDeletePreset() {
  if (!canDeletePreset.value) return;

  const preset = getSelectedPreset();
  if (!preset) return;

  const popup = new Popup(
    t`確定要刪除配置` + `「${preset.name}」` + t`嗎？`,
    POPUP_TYPE.CONFIRM
  );
  const result = await popup.show();
  if (result !== POPUP_RESULT.AFFIRMATIVE) return;

  // 從列表中移除
  const index = settingsStore.settings.presets.findIndex(p => p.id === preset.id);
  if (index !== -1) {
    settingsStore.settings.presets.splice(index, 1);
  }

  toastr.success(t`已刪除配置` + `「${preset.name}」`, t`成功`);
  logger.log('[PanelSettings] 已刪除配置:', preset.name);

  // 清空選擇
  selectedPresetId.value = '';
}

// 切換 CSS 編輯器
function toggleCSSEditor() {
  cssEditorExpanded.value = !cssEditorExpanded.value;
}

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
    const popup = new Popup(
      t`確定要匯入此備份嗎？<br>這將覆蓋目前的所有設定（欄位、Prompt、樣式等）。`,
      POPUP_TYPE.CONFIRM
    );
    const result = await popup.show();
    if (result !== POPUP_RESULT.AFFIRMATIVE) {
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

// 儲存到角色卡
async function handleSaveToCharacter() {
  try {
    logger.log('[PanelSettings] 開始儲存到角色卡');

    // 檢查是否有選擇角色
    const context = getContext();
    if (context.characterId === undefined || context.characterId === null) {
      toastr.warning(t`請先選擇一個角色`, t`提示`);
      return;
    }

    // 取得角色名稱
    const character = (context.characters as any)?.[context.characterId];
    const characterName = character?.name || t`角色`;

    // 確認儲存
    const confirmMessage = t`確定要將目前的設定儲存到角色卡` + `「${characterName}」` + t`嗎？` + '<br><br>' + t`這將把欄位、Prompt、樣式等設定寫入角色卡的擴充資料中。` + '<br>' + t`匯出角色卡時會一併帶走這些設定。`;
    const popup = new Popup(confirmMessage, POPUP_TYPE.CONFIRM);
    const result = await popup.show();
    if (result !== POPUP_RESULT.AFFIRMATIVE) {
      logger.log('[PanelSettings] 用戶取消儲存到角色卡');
      return;
    }

    // 執行儲存
    const success = await saveSettingsToCharacterCard(settingsStore.settings);

    if (success) {
      toastr.success(t`設定已儲存到角色卡` + `「${characterName}」`, t`成功`);
    } else {
      toastr.error(t`儲存失敗，請檢查控制台`, t`錯誤`);
    }
  } catch (error) {
    logger.error('[PanelSettings] 儲存到角色卡失敗:', error);
    toastr.error(
      error instanceof Error ? error.message : t`儲存失敗`,
      t`錯誤`
    );
  }
}

// 載入範例模板
function handleLoadTemplate() {
  const template = `/* ========================================
   Status Tracking 自訂樣式模板
   ======================================== */

/* -------------------- 1. 主面板容器 -------------------- */
/* 整個狀態面板的最外層容器 */
.status-panel {
  /* 背景、邊框、圓角、陰影等 */
}

/* 當面板位於左側時 */
.status-panel.left {

}

/* 當面板位於右側時 */
.status-panel.right {

}

/* 當面板處於收合狀態時 */
.status-panel.collapsed {

}


/* -------------------- 2. 收合按鈕 -------------------- */
/* 面板收合/展開的切換按鈕 */
.collapse-toggle {

}

/* 收合按鈕內的圖示 */
.collapse-toggle i {

}


/* -------------------- 3. 面板內容區 -------------------- */
/* 包含所有內容的主區域（收合時會隱藏） */
.panel-content {

}


/* -------------------- 4. 標題區塊 -------------------- */
/* 面板頂部的標題區域 */
.panel-header {

}

/* 標題文字 */
.panel-header h3 {

}


/* -------------------- 5. 固定資訊區塊 -------------------- */
/* 包含時間、地點、天氣、新鮮事的區域 */
.fixed-info-section {

}

/* 資訊項目容器（時間/地點/天氣） */
.info-item {

}

/* 資訊項目內的每個 div */
.info-item > div {

}

/* 資訊圖示（📅📍🌤️） */
.info-icon {

}

/* 資訊文字 */
.info-text {

}


/* -------------------- 6. 新鮮事區塊 -------------------- */
/* 新鮮事區塊外層容器 */
.news-section {

}

/* 新鮮事區塊內層容器 */
.news-section2 {

}

/* 新鮮事標題【新鮮事】 */
.news-header {

}

/* 新鮮事內容容器（包含分隔線、標題、內文） */
.news-no-header {

}

/* 新鮮事分隔線 */
.news-divider {

}

/* 新鮮事標題文字 */
.news-title {

}

/* 新鮮事內文 */
.news-content {

}


/* -------------------- 7. 自訂欄位區塊 -------------------- */
/* 用戶自訂欄位的容器 */
.custom-fields-section {

}

/* 狀態清單容器 */
.status-list {

}

/* 單個狀態項目 */
.status-item {

}

/* 狀態名稱（欄位標題） */
.status-name {

}

/* 狀態值容器 */
.status-value {

}

/* 文字類型的狀態值 */
.value-text {

}


/* -------------------- 8. 進度條（數字類型欄位） -------------------- */
/* 進度條外層容器 */
.progress-bar-container {
  /* 注意：此元素使用 CSS 變數控制顏色
     --progress-low-color: 低值顏色
     --progress-high-color: 高值顏色 */
}

/* 進度條填充部分 */
.progress-bar-fill {

}

/* 進度條上的數字文字 */
.progress-text {

}


/* -------------------- 9. 空狀態提示 -------------------- */
/* 當沒有設定任何欄位時顯示的提示文字 */
.empty-hint {

}


/* -------------------- 10. 按鈕區 -------------------- */
/* 底部按鈕區域容器 */
.panel-actions {

}

/* 按鈕樣式（繼承自 ST 的 .menu_button） */
.panel-actions .menu_button {

}

/* 按鈕內的圖示 */
.panel-actions .menu_button i {

}


/* ========================================
   使用說明
   ======================================== */
/*
1. 複製需要修改的區塊到下方
2. 在大括號 {} 內添加你的 CSS 樣式
3. 使用 !important 確保樣式優先級
4. 點擊彈窗下方的「確定」按鈕套用

範例：
.status-panel {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border-radius: 16px !important;
}

.status-name {
  color: #ffd700 !important;
  font-weight: bold !important;
}
*/
`;

  const confirmed = confirm(t`載入範例模板將覆蓋當前的 CSS 內容，確定要繼續嗎？`);
  if (confirmed) {
    tempSettings.value.custom_css = template;
    toastr.success(t`範例模板已載入`, t`成功`);
  }
}

// 匯出 CSS
async function handleExportCSS() {
  try {
    logger.log('[PanelSettings] 開始匯出 CSS');

    const css = tempSettings.value.custom_css || '';

    // 加入註解標頭
    const header = `/* Status Tracking 自訂主題 */\n/* 匯出時間: ${new Date().toLocaleString()} */\n\n`;
    const cssWithHeader = header + css;

    // 下載 CSS 檔案
    const blob = new Blob([cssWithHeader], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `status-tracking-theme-${new Date().toISOString().slice(0, 10)}.css`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toastr.success(t`CSS 已匯出`, t`成功`);
  } catch (error) {
    logger.error('[PanelSettings] 匯出 CSS 失敗:', error);
    toastr.error(t`匯出失敗，請檢查控制台`, t`錯誤`);
  }
}

// 匯入 CSS
async function handleImportCSS() {
  try {
    logger.log('[PanelSettings] 開始匯入 CSS');

    // 打開檔案選擇器
    const file = await openFileSelector('.css,text/css');
    if (!file) {
      logger.log('[PanelSettings] 用戶取消選擇檔案');
      return;
    }

    // 讀取 CSS 檔案
    const css = await file.text();

    // 更新臨時設定
    tempSettings.value.custom_css = css;

    logger.log('[PanelSettings] CSS 匯入成功');
    toastr.success(t`CSS 已匯入，請點擊「儲存」套用`, t`成功`);
  } catch (error) {
    logger.error('[PanelSettings] 匯入 CSS 失敗:', error);
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

